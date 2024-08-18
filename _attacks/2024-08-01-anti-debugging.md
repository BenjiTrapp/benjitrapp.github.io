---
layout: attack
title: Anti Debugging 
---

<img height="150" align="left" src="/images/antidebug.png"> The techniques described below are intended to detect if a debugger is present, based on how debuggers behave when the CPU executes a certain instruction. The main focus here lays on Windows but most of the techniques can easily be adopted for *nix based operating systems with ease. Most of the techniques here also require some additional obfuscation and hardening in order to decrease the likelihood of getting fast reversed by a forensic guy.


- [Basic C/C++ debugger detection snippets](#basic-cc-debugger-detection-snippets)
- [Assembly instructions](#assembly-instructions)
  - [INT 3](#int-3)
  - [INT 2D](#int-2d)
  - [DebugBreak](#debugbreak)
  - [ICE](#ice)
  - [Stack Segment Register](#stack-segment-register)
  - [POPF and Trap Flag](#popf-and-trap-flag)
  - [Instruction Prefixes](#instruction-prefixes)
- [Mitigations](#mitigations)


## Basic C/C++ debugger detection snippets

A very basic option to detect a debugger, is to create a delta based on the tick counts and check the elapsed time. If a debugger is getting attached this function will detect it over the changed timing. If this function is returning false we can throw of the debugger at a random benign location and not execute the malicious part of our application. 

```cpp
#include <iostream>
#include <Windows.h>

BOOL isDebuggerPresentTickCount() {
	DWORD referenceTicCount = GetTickCount();

	Sleep(1500); //Should be replaced with a function and calculate a prime

	DWORD currentTick = GetTickCount();
	DWORD elapsedTime = currentTick - referenceTicCount;

	return elapsedTime > 2000;
}

```
`
The two brothers in crime are using `GetLocalTime()` and `QueryPerformanceFrequency()`. Additional we can also calculate a prime number here to spend some time and circumvent a monkey patching of the sleep function. This can additionally help to evade EDR/XDR analysis in sandboxes:

```cpp
BOOL isDebuggerPresentLocalTime(){
    SYSTEMTIME startTime, endTime;
    GetLocalTime(&startTime);

    calculatePrime();

    GetLocalTime(&endTime);

    int deltaSeconds = (endTime.wSecond - startTime.wSecond) +
        (endTime.wMinute - startTime.wMinute) * 60 +
        (endTime.wHour - startTime.wHour) * 3600;

    // Check if the delta is between 9 and 11 secs 
    return (deltaSeconds >= 9 && deltaSeconds <= 11);
}

BOOL isDebuggerPresentQueryPerformanceCounter() {
    LARGE_INTEGER frequency, startTime, endTime;
    QueryPerformanceFrequency(&frequency);
    QueryPerformanceCounter(&startTime);

    calculatePrime(); //Spend some time

    QueryPerformanceCounter(&endTime);

    double deltaSeconds = static_cast<double>(endTime.QuadPart - startTime.QuadPart) / frequency.QuadPart;

    return (deltaSeconds >= 9.0 && deltaSeconds <= 11.0);
}

void calculatePrime() {
    const long long target = 1000000000;
    long long count = 0;
    for (long long i = 2; i < target; ++i) {
        bool isPrime = true;
        for (long long j = 2; j * j <= i; ++j) {
            if (i % j == 0) {
                isPrime = false;
                break;
            }
        }
        if (isPrime) {
            ++count;
        }
    }
}

```

## Assembly instructions
Another way to disturb debugging processes are using Assembly instructions. They don't create interferences with the regular execution of the program but hook a debugger. That can help to disturb the normal execution during debugging sessions and let a reverse engineer run into circles. 

### INT 3
THe instruction INT3 is an interruption in a nutshell, that is used as a software breakpoint. Without a debugger present, after getting to an INT3 instruction, the exception `EXCEPTION_BREAKPOINT (0x80000003) is thrown and transferred to an exception handler. If the debugger is present, the control won't be given to the exception handler.

```cpp
BOOL IsDebugged() {
    __try
    {
        __asm int 3;
        return true;
    }
    __except(EXCEPTION_EXECUTE_HANDLER)
    {
        return false;
    }
}
```

Besides the short form of INT3 instruction in opcode `0xCC`. There is also a long form of the opcode: `CD 03`.

When the exception EXCEPTION_BREAKPOINT occurs, Windows will decrements the EIP (Extended Instruction Pointer) register to the assumed location of the 0xCC opcode and pass the control to the exception handler. In case of using the long form of the INT3 instruction, the EIP will point to the middle of the instruction (f.e. to 0x03 byte). Thats why EIP should be edited in the exception handler if we want to continue execution after the INT3 instruction. Otherwise we’ll most likely get an EXCEPTION_ACCESS_VIOLATION exception that will crash the application if not caught. Otherwise we can neglect the instruction pointer modification.

```cpp

BOOL g_bDebugged = false;

int filter(unsigned int code, struct _EXCEPTION_POINTERS *ep) {
    g_bDebugged = code != EXCEPTION_BREAKPOINT;
    return EXCEPTION_EXECUTE_HANDLER;
}

BOOL IsDebugged() {
    __try
    {
        __asm __emit(0xCD);
        __asm __emit(0x03);
    }
    __except (filter(GetExceptionCode(), GetExceptionInformation()))
    {
        return g_bDebugged;
    }
}
```

### INT 2D
When the INT2D instruction is executed, similar to the INT3 instruction, it raises the EXCEPTION_BREAKPOINT exception. However, with INT2D, Windows uses the EIP register as the exception address and then increments the EIP register value. Additionally, Windows checks the value of the EAX register during INT2D execution. If EAX is 1, 3, or 4 on all Windows versions, or 5 on Vista and later, the exception address is increased by one.

This instruction can cause issues for some debuggers because, after the EIP increment, the byte following the INT2D instruction is skipped, potentially leading to the execution of a corrupted instruction.

In the example below, a one-byte NOP instruction is placed after INT2D to ensure it is always skipped. If the program runs without a debugger, control is passed to the exception handler.

```cpp
BOOL IsDebugged() {
    __try
    {
        __asm xor eax, eax;
        __asm int 0x2d;
        __asm nop;
        return true;
    }
    __except(EXCEPTION_EXECUTE_HANDLER)
    {
        return false;
    }
}
```

### DebugBreak
As stated in the [DebugBreak documentation](https://learn.microsoft.com/en-us/windows/win32/api/debugapi/nf-debugapi-debugbreak), "DebugBreak causes a breakpoint exception to occur in the current process. This allows the calling thread to signal the debugger to handle the exception."

If the program runs without a debugger, control is passed to the exception handler. Otherwise, the debugger intercepts the execution.

```cpp
BOOL IsDebugged() {
    __try
    {
        DebugBreak();
    }
    __except(EXCEPTION_BREAKPOINT)
    {
        return false;
    }
    
    return true;
}
```


### ICE
"ICE" is an undocumented Intel instruction with the opcode `0xF1`. It can be used to detect if a program is being traced.

When the ICE instruction is executed, it raises the EXCEPTION_SINGLE_STEP (0x80000004) exception.

However, if the program is already being traced, the debugger treats this exception as a normal exception generated by executing an instruction with the SingleStep bit set in the Flags register. As a result, under a debugger, the exception handler will not be called, and execution will continue after the ICE instruction.

```cpp
BOOL IsDebugged() {
    __try
    {
        __asm __emit 0xF1;
        return true;
    }
    __except(EXCEPTION_EXECUTE_HANDLER)
    {
        return false;
    }
}
```

### Stack Segment Register
This technique can be used to detect if a program is being traced. It involves single-stepping through the following sequence of assembly instructions:

```assembly
push ss 
pop ss 
pushf
```

After single-stepping through this code in a debugger, the Trap Flag will be set. Typically, this is not visible because debuggers clear the Trap Flag after each debugger event. However, by previously saving the EFLAGS register to the stack, we can check whether the Trap Flag is set.

```cpp
BOOL IsDebugged() {
    BOOL bTraced = false;

    __asm
    {
        push ss
        pop ss
        pushf
        test byte ptr [esp+1], 1
        jz movss_not_being_debugged
    }

    bTraced = true;

movss_not_being_debugged:
    // restore stack
    __asm popf;

    return bTraced;
}
```

### POPF and Trap Flag
The Trap Flag in the Flags register, when set, raises the SINGLE_STEP exception. However, if the code is being traced, the debugger will clear the Trap Flag, preventing the exception from being raised.

```cpp
BOOL IsDebugged() {
    __try
    {
        __asm
        {
            pushfd
            mov dword ptr [esp], 0x100
            popfd
            nop
        }
        return true;
    }
    __except(GetExceptionCode() == EXCEPTION_SINGLE_STEP
        ? EXCEPTION_EXECUTE_HANDLER
        : EXCEPTION_CONTINUE_EXECUTION)
    {
        return false;
    }
}
```


### Instruction Prefixes

This technique works in certain debuggers by exploiting how they handle instruction prefixes.

When the following code is executed in OllyDbg, stepping to the first byte F3 will immediately jump to the end of the try block. The debugger skips the prefix and transfers control to the INT1 instruction.

However, running the same code without a debugger will raise an exception, directing execution to the except block.

```cpp
BOOL IsDebugged()
{
    __try
    {
        // 0xF3 0x64 disassembles as PREFIX REP:
        __asm __emit 0xF3
        __asm __emit 0x64
        // One byte INT 1
        __asm __emit 0xF1
        return true;
    }
    __except(EXCEPTION_EXECUTE_HANDLER)
    {
        return false;
    }
}
```

## Mitigations
During debugging: The best way to mitigate all the following checks is to patch them with NOP instructions. 

Anti-tracing techniques: instead of patching the code, simply set a breakpoint in the code which follows the check and run the program till this breakpoint.

For anti-anti-debug tool development: No mitigation.
