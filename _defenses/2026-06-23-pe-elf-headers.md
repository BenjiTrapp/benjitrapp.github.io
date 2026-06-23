---
layout: defense
title: "PE & ELF Headers: Structure, Analysis & Malware Hiding Spots"
---
<img height="200" align="left" src="/images/pe_elf_headers.png">
Understanding the binary formats that operating systems load is foundational to malware analysis and incident response. When you can read a PE or ELF header fluently, a packed dropper, a process-hollowed victim, or a rootkit-injected shared object stops being opaque; the anomalies jump out before you even open a disassembler. This article walks through both formats field by field, builds annotated hex mockups, and catalogs every common hiding spot with the detection command that exposes it.

---

## PE Headers: Windows Portable Executable

Every Windows executable, DLL, driver, and COM object shares the same on-disk layout. The loader reads the headers, maps sections into memory, resolves imports, and transfers control to the entry point. Knowing exactly what the loader reads tells you exactly where an attacker can lie.

### DOS Header: `IMAGE_DOS_HEADER`

The very first two bytes of every PE file are <span class="addr">0x4D 0x5A</span>, the ASCII characters `MZ`, the initials of Mark Zbikowski, one of the original MS-DOS architects. The `e_magic` field at offset 0 holds this value. The loader checks it first; if it is absent the file is rejected immediately.

The field that matters most for PE parsing is `e_lfanew` at offset <span class="addr">0x3C</span>. It is a 32-bit offset (RVA relative to the start of the file) that points to the PE signature. In the vast majority of real-world executables this value is <span class="addr">0x80</span> or <span class="addr">0x100</span>, though technically any value ≥ 64 is valid. Malware packers sometimes push it very far forward and pack data in the space between the DOS stub and the PE signature.

Between the DOS header and the PE signature sits the **DOS stub**, a tiny 16-bit program that prints "This program cannot be run in DOS mode" and exits with an error code. It is vestigial on modern systems but the loader still skips over it. Attackers occasionally replace stub bytes with shellcode, though this is uncommon because nothing executes it on NT systems.

### PE Signature

At the offset given by `e_lfanew` you find four bytes: <span class="addr">0x50 0x45 0x00 0x00</span>, i.e. `PE\0\0` in ASCII. The two trailing null bytes are required. If they are wrong the loader refuses to map the file.

### COFF File Header: `IMAGE_FILE_HEADER`

Immediately following the PE signature is the 20-byte COFF File Header. Its fields:

- **`Machine`**: target architecture. <span class="addr">0x014C</span> = x86 (i386), <span class="addr">0x8664</span> = x86-64 (AMD64), <span class="addr">0x01C4</span> = ARM Thumb-2, <span class="addr">0xAA64</span> = ARM64 (AArch64). A mismatch between this field and the host CPU causes an immediate load failure, unless the binary is masquerading as a different architecture through packer tricks.
- **`NumberOfSections`**: count of `IMAGE_SECTION_HEADER` entries that follow the optional header. Legitimate files rarely exceed 8–12 sections; highly packed or obfuscated samples sometimes have 1 (the entire binary is a single blob) or 20+ (section injection).
- **`TimeDateStamp`**: Unix epoch timestamp of when the linker produced the file. Valuable for threat intelligence clustering (same compiler run = same build infrastructure), but trivially forged. Zero or the Unix epoch (<span class="addr">0x00000000</span>) is a common red flag. Values far in the past or future (year 1970, year 2099) indicate deliberate zeroing.
- **`SizeOfOptionalHeader`**: size of the next header. For PE32 this is typically <span class="addr">0x00E0</span>, for PE32+ <span class="addr">0x00F0</span>. An unexpected value breaks parsing in some tools.
- **`Characteristics`**: bitmask of file properties. <span class="flag">IMAGE_FILE_EXECUTABLE_IMAGE</span> (<span class="addr">0x0002</span>) marks an EXE; <span class="flag">IMAGE_FILE_DLL</span> (<span class="addr">0x2000</span>) marks a DLL. Having both bits set simultaneously is suspicious — a legitimate DLL should not claim to be an executable image.

### Optional Header: `IMAGE_OPTIONAL_HEADER`

Despite the name, this header is mandatory. At 96 bytes (PE32) or 112 bytes (PE32+) it is the largest header and carries the most analysis-relevant fields.

**`Magic`** identifies the sub-format: <span class="addr">0x010B</span> = PE32 (32-bit), <span class="addr">0x020B</span> = PE32+ (64-bit). A PE32+ binary with a 32-bit `Machine` field is a structural impossibility and should trigger immediate suspicion.

**`AddressOfEntryPoint`** (AEP) is a Relative Virtual Address (RVA), an offset from `ImageBase` — where the loader transfers control after setup. For DLLs this is `DllMain`; for EXEs it is the CRT startup stub before `WinMain`/`main`. A critical check: the section containing AEP should be executable (characteristics flag `0x20000000`) and ideally read-only. If AEP points into a writable section (`.data`, `.bss`, or a packed section marked RW), that strongly suggests the loader stub decrypts code into that region at runtime — classic packer or shellcode loader behavior.

**`ImageBase`** is the preferred load address. The default for EXEs is <span class="addr">0x00400000</span> and for DLLs <span class="addr">0x10000000</span>, though ASLR overrides this at load time. Malware sometimes sets `ImageBase` to zero and relies entirely on the base relocation table, or sets it to a value that collides with a known system DLL to force that DLL to relocate.

**`SectionAlignment`** and **`FileAlignment`** control how sections are padded in memory vs. on disk respectively. `SectionAlignment` is almost always <span class="addr">0x1000</span> (page size); `FileAlignment` is typically <span class="addr">0x200</span> (sector size). If `SectionAlignment < FileAlignment` the loader rejects the file. If they are set equal (e.g., both <span class="addr">0x1000</span>), the binary is a "raw" or "aligned" PE — sometimes used by shellcode loaders that want on-disk layout identical to in-memory layout.

**`SizeOfImage`** must equal the total in-memory footprint of the binary rounded up to `SectionAlignment`. Packers that inject additional PT_LOAD-like sections at runtime sometimes set this value larger than what the section headers account for, reserving virtual address space for dynamically allocated code.

**`DllCharacteristics`** is the security feature bitmask. The flags every analyst should know:

| Flag | Value | Meaning |
|---|---|---|
| <span class="flag">ASLR</span> (DYNAMIC_BASE) | <span class="addr">0x0040</span> | Binary can be loaded at a random base address |
| <span class="flag">NX</span> (NX_COMPAT) | <span class="addr">0x0100</span> | Compatible with Data Execution Prevention |
| <span class="flag">NO_SEH</span> | <span class="addr">0x0400</span> | No Structured Exception Handling used |
| <span class="flag">FORCE_INTEGRITY</span> | <span class="addr">0x0080</span> | Code integrity checks enforced |
| <span class="flag">CFG</span> | <span class="addr">0x4000</span> | Control Flow Guard enabled |
| <span class="flag">TERMINAL_SERVER_AWARE</span> | <span class="addr">0x8000</span> | Aware of terminal server session |

Legitimate modern binaries compiled with `/DYNAMICBASE /NXCOMPAT` will have both <span class="flag">ASLR</span> and <span class="flag">NX</span> set. Malware compiled with older or custom toolchains frequently has neither. The absence of <span class="flag">CFG</span> in a binary claiming to be a Windows system component is an anomaly worth investigating.

### Data Directories

The final 128 bytes of the Optional Header are the **Data Directory**, with 16 entries of 8 bytes each (`RVA` + `Size`), each pointing to a specific structure within the mapped binary. Not all entries are used; unused entries have both fields zeroed. The most security-relevant entries:

- **Import Table** (entry 1): points to the `IMAGE_IMPORT_DESCRIPTOR` array. Every imported DLL has an entry here listing the API names or ordinals to resolve. This is the first thing analysts check: what APIs does this binary call? `kernel32.dll` with only `LoadLibraryA` and `GetProcAddress` means all other API resolution is at runtime — typical of loaders and shellcode runners.
- **Export Table** (entry 0): present in DLLs, lists functions other binaries can import. Malware DLLs (sideloading payloads, proxy DLLs) may export a single function or forward all exports to the legitimate DLL they are masquerading as.
- **Resource Table** (entry 2): `.rsrc` section tree: icons, version info, string tables, dialogs. A high-entropy `RCDATA` or `BITMAP` resource of several hundred kilobytes is a classic sign of an encrypted payload stored for runtime extraction.
- **Certificate Table** (entry 4): points to the Authenticode signature (WIN_CERTIFICATE structure) appended to the file. This data is **not** mapped into memory — it lives in the file overlay. Attackers can steal a legitimate signature's certificate data and re-use it after patching the binary; `sigcheck -a` and `AuthentiCheck` detect the mismatch.
- **Base Relocation Table** (entry 5): required when ASLR loads the binary at a non-preferred base address. Binaries compiled without `/FIXED` include this; malware that patches absolute addresses into its code may strip the relocation table entirely, breaking ASLR.
- **TLS Directory** (entry 9): Thread Local Storage. Contains an array of callback function pointers executed **before** `AddressOfEntryPoint`. This is a favorite anti-analysis trick: the TLS callback runs before any breakpoint on OEP can fire. `pescan -t` and `capa` detect TLS callbacks.
- **Load Config Directory** (entry 10): among other things, contains the `/GS` security cookie and the CFG function bitmap. Its absence in a binary claiming CFG support is a contradiction.
- **IAT** (entry 12): Import Address Table. In-memory, this table is patched by the loader with the resolved function addresses. Memory scanners compare disk IAT entries (which should be thunks pointing back into the import descriptor) to in-memory values; patched entries indicate IAT hooking.

### Section Headers: `IMAGE_SECTION_HEADER`

Each section header is 40 bytes. The fields:

- **`Name`**: 8 bytes, null-padded (not null-terminated if exactly 8 chars). Conventional names are metadata, not enforced by the loader: the loader ignores the name entirely and only looks at the characteristics and addresses.
- **`VirtualSize`**: size of the section in memory.
- **`VirtualAddress`**: RVA where the section is mapped.
- **`SizeOfRawData`**: size of the section on disk (must be aligned to `FileAlignment`).
- **`PointerToRawData`**: file offset of the section's raw bytes.
- **`Characteristics`**: bitmask: `0x20000000` = execute, `0x40000000` = read, `0x80000000` = write.

Conventional sections and their expected characteristics:

| Section | Expected flags | Notes |
|---|---|---|
| `.text` | Execute + Read | Code. Should never be writable. |
| `.data` | Read + Write | Initialized global variables. |
| `.rdata` | Read only | Constants, import/export tables, strings. |
| `.rsrc` | Read only | Resources. |
| `.reloc` | Read only | Base relocation table. |
| `.bss` | Read + Write | Uninitialized data (often merged into `.data`). |

Red flags in section headers:
- **Write + Execute simultaneously** (`0xE0000000`) — no legitimate section needs both. Classic sign of self-modifying shellcode, a packer stub, or process injection.
- **`VirtualSize` >> `SizeOfRawData`**: the section is much larger in memory than on disk. The extra space is zeroed by the loader and then filled at runtime, the hallmark of an unpacking stub.
- **High entropy** (> 7.0 bits/byte): sections of random-looking data indicate compression or encryption. Legitimate code averages 5.5–6.5; compressed/encrypted blobs approach 8.0.
- **Blank or control-character names** — the loader doesn't care, but tools that rely on section names for heuristics skip unnamed sections.
- **Extra sections beyond what the linker produces** — injected by packers or hollowing tools, usually at the end of the section table.

### PE Header Diagram

<div class="elf-layout-diagram">

  <!-- ── DOS Header ────────────────────────────────────── -->
  <div class="eld-block">
    <div class="eld-fields">
      <div class="eld-label" style="background:#093530; color:#4ec9b0;">DOS Header: IMAGE_DOS_HEADER (64 bytes, offset 0x00)</div>
      <div class="eld-row" style="background:#0b3d36;">
        <div class="eld-cell" style="color:#f85149; font-weight:700;">e_magic: 0x5A4D<div class="eld-note">"MZ", Mark Zbikowski · loader rejects file if absent</div></div>
        <div class="eld-cell" style="color:#a9b7c6;">e_cblp<div class="eld-note">bytes on last page</div></div>
        <div class="eld-cell" style="color:#a9b7c6;">e_cp<div class="eld-note">pages in file</div></div>
        <div class="eld-cell" style="color:#a9b7c6;">e_crlc<div class="eld-note">relocations</div></div>
      </div>
      <div class="eld-row" style="background:#0b3d36;">
        <div class="eld-cell" style="color:#a9b7c6;">e_cparhdr<div class="eld-note">header size (paragraphs)</div></div>
        <div class="eld-cell" style="color:#a9b7c6;">e_minalloc</div>
        <div class="eld-cell" style="color:#a9b7c6;">e_maxalloc</div>
        <div class="eld-cell" style="color:#a9b7c6;">e_ss · e_sp</div>
      </div>
      <div class="eld-row" style="background:#0b3d36;">
        <div class="eld-cell" style="color:#a9b7c6;">e_csum · e_ip · e_cs</div>
        <div class="eld-cell" style="color:#a9b7c6;">e_lfarlc · e_ovno</div>
        <div class="eld-cell eld-w2" style="color:#2a4a3a; font-style:italic;">e_res[4]: reserved (8 bytes, always zero)</div>
      </div>
      <div class="eld-row" style="background:#0b3d36;">
        <div class="eld-cell" style="color:#a9b7c6;">e_oemid · e_oeminfo</div>
        <div class="eld-cell eld-w3" style="color:#2a4a3a; font-style:italic;">e_res2[10] — reserved (20 bytes, always zero)</div>
      </div>
      <div class="eld-row" style="background:#0b3d36;">
        <div class="eld-cell eld-w4" style="color:#fbbf24; font-weight:700;">e_lfanew — at offset 0x3C — 32-bit pointer to PE signature<div class="eld-note">Typically 0x80 or 0x100. Packers push this far forward to hide data between DOS stub and PE signature.</div></div>
      </div>
    </div>
    <div class="eld-region" style="background:#062820; border-left:3px solid #4ec9b0;">
      <span class="eld-region-text" style="color:#4ec9b0;">DOS Header</span>
    </div>
  </div>

  <!-- ── DOS Stub ───────────────────────────────────────── -->
  <div class="eld-block">
    <div class="eld-fields">
      <div class="eld-label" style="background:#0a1f3a; color:#60a5fa;">DOS Stub — 16-bit Program (variable size)</div>
      <div class="eld-row" style="background:#0d2545;">
        <div class="eld-cell eld-w4" style="color:#60a5fa;">16-bit x86 machine code<div class="eld-note">Prints "This program cannot be run in DOS mode" and exits. Never runs on NT. Attackers sometimes replace with shellcode — but nothing executes it on Windows NT kernels.</div></div>
      </div>
    </div>
    <div class="eld-region" style="background:#071428; border-left:3px solid #60a5fa;">
      <span class="eld-region-text" style="color:#60a5fa;">DOS Stub</span>
    </div>
  </div>

  <!-- ── PE Signature + COFF File Header ───────────────── -->
  <div class="eld-block">
    <div class="eld-fields">
      <div class="eld-label" style="background:#1f1f00; color:#fbbf24;">PE Signature + COFF File Header — IMAGE_FILE_HEADER (24 bytes total)</div>
      <div class="eld-row" style="background:#252500;">
        <div class="eld-cell eld-w4" style="color:#f85149; font-weight:700;">Signature: 0x50 0x45 0x00 0x00 — "PE\0\0"<div class="eld-note">Must be exactly these 4 bytes at the offset given by e_lfanew. Wrong bytes = loader refuses to map the file.</div></div>
      </div>
      <div class="eld-row" style="background:#252500;">
        <div class="eld-cell" style="color:#f85149; font-weight:700;">Machine<div class="eld-note">0x014C=x86 · 0x8664=AMD64 · 0x01C4=ARM · 0xAA64=ARM64</div></div>
        <div class="eld-cell" style="color:#fbbf24; font-weight:700;">NumberOfSections<div class="eld-note">determines how many IMAGE_SECTION_HEADER entries follow</div></div>
      </div>
      <div class="eld-row" style="background:#252500;">
        <div class="eld-cell eld-w4" style="color:#fb923c;">TimeDateStamp<div class="eld-note">Unix timestamp of link time. Malware zeroes or fakes this. Legitimate Microsoft system files have verifiable timestamps.</div></div>
      </div>
      <div class="eld-row" style="background:#252500;">
        <div class="eld-cell eld-w2" style="color:#555; font-style:italic;">PointerToSymbolTable<div class="eld-note">deprecated — should be 0</div></div>
        <div class="eld-cell eld-w2" style="color:#555; font-style:italic;">NumberOfSymbols<div class="eld-note">deprecated — should be 0</div></div>
      </div>
      <div class="eld-row" style="background:#252500;">
        <div class="eld-cell" style="color:#fcd34d;">SizeOfOptionalHeader<div class="eld-note">PE32=0xE0 · PE32+=0xF0</div></div>
        <div class="eld-cell eld-w3" style="color:#fbbf24; font-weight:700;">Characteristics<div class="eld-note">0x0002=EXE · 0x2000=DLL · 0x0100=32-bit · 0x0020=stripped · 0x0001=no relocations</div></div>
      </div>
    </div>
    <div class="eld-region" style="background:#141400; border-left:3px solid #fbbf24;">
      <span class="eld-region-text" style="color:#fbbf24;">PE Sig + COFF Header</span>
    </div>
  </div>

  <!-- ── Optional Header — Standard fields ─────────────── -->
  <div class="eld-block">
    <div class="eld-fields">
      <div class="eld-label" style="background:#0a2a10; color:#4ade80;">Optional Header — Standard Fields (IMAGE_OPTIONAL_HEADER)</div>
      <div class="eld-row" style="background:#0d3515;">
        <div class="eld-cell" style="color:#4ade80; font-weight:700;">Magic<div class="eld-note">0x010B = PE32 · 0x020B = PE32+</div></div>
        <div class="eld-cell" style="color:#a9b7c6;">MajorLinkerVersion</div>
        <div class="eld-cell" style="color:#a9b7c6;">MinorLinkerVersion</div>
      </div>
      <div class="eld-row" style="background:#0d3515;">
        <div class="eld-cell eld-w4" style="color:#a9b7c6;">SizeOfCode<div class="eld-note">sum of sizes of all code sections</div></div>
      </div>
      <div class="eld-row" style="background:#0d3515;">
        <div class="eld-cell eld-w2" style="color:#a9b7c6;">SizeOfInitializedData</div>
        <div class="eld-cell eld-w2" style="color:#a9b7c6;">SizeOfUninitializedData</div>
      </div>
      <div class="eld-row" style="background:#0d3515;">
        <div class="eld-cell eld-w4" style="color:#fbbf24; font-weight:700;">AddressOfEntryPoint (RVA)<div class="eld-note">OEP — where Windows transfers control. Malware: check if this RVA falls inside a writable or non-.text section — red flag for packed code.</div></div>
      </div>
      <div class="eld-row" style="background:#0d3515;">
        <div class="eld-cell eld-w2" style="color:#a9b7c6;">BaseOfCode (RVA)</div>
        <div class="eld-cell eld-w2" style="color:#555; font-style:italic;">BaseOfData (RVA) — PE32 only, absent in PE32+</div>
      </div>
    </div>
    <div class="eld-region" style="background:#071a0a; border-left:3px solid #4ade80;">
      <span class="eld-region-text" style="color:#4ade80;">Optional Header (Standard)</span>
    </div>
  </div>

  <!-- ── Optional Header — Windows-specific fields ─────── -->
  <div class="eld-block">
    <div class="eld-fields">
      <div class="eld-label" style="background:#0a2010; color:#86efac;">Optional Header — Windows-Specific Fields</div>
      <div class="eld-row" style="background:#0e2a14;">
        <div class="eld-cell eld-w4" style="color:#86efac; font-weight:700;">ImageBase<div class="eld-note">preferred load address (4b PE32 / 8b PE32+). ASLR overrides this. DLLs: 0x10000000, EXEs: 0x00400000. Hollowed processes show wrong ImageBase in PEB.</div></div>
      </div>
      <div class="eld-row" style="background:#0e2a14;">
        <div class="eld-cell eld-w2" style="color:#6ee7b7;">SectionAlignment<div class="eld-note">typically 0x1000 (4 KB page)</div></div>
        <div class="eld-cell eld-w2" style="color:#6ee7b7;">FileAlignment<div class="eld-note">typically 0x200 (512 bytes)</div></div>
      </div>
      <div class="eld-row" style="background:#0e2a14;">
        <div class="eld-cell" style="color:#a9b7c6;">MajorOS<div class="eld-note">version</div></div>
        <div class="eld-cell" style="color:#a9b7c6;">MinorOS<div class="eld-note">version</div></div>
        <div class="eld-cell" style="color:#a9b7c6;">MajorImage<div class="eld-note">version</div></div>
        <div class="eld-cell" style="color:#a9b7c6;">MinorImage<div class="eld-note">version</div></div>
      </div>
      <div class="eld-row" style="background:#0e2a14;">
        <div class="eld-cell" style="color:#a9b7c6;">MajorSubsystem<div class="eld-note">version</div></div>
        <div class="eld-cell" style="color:#a9b7c6;">MinorSubsystem<div class="eld-note">version</div></div>
        <div class="eld-cell eld-w2" style="color:#555; font-style:italic;">Win32VersionValue<div class="eld-note">reserved — must be 0</div></div>
      </div>
      <div class="eld-row" style="background:#0e2a14;">
        <div class="eld-cell eld-w2" style="color:#6ee7b7;">SizeOfImage<div class="eld-note">total virtual size — must be multiple of SectionAlignment</div></div>
        <div class="eld-cell eld-w2" style="color:#6ee7b7;">SizeOfHeaders<div class="eld-note">file offset where first section raw data begins</div></div>
      </div>
      <div class="eld-row" style="background:#0e2a14;">
        <div class="eld-cell" style="color:#f87171;">CheckSum<div class="eld-note">0 in most malware · wrong value = tampered</div></div>
        <div class="eld-cell" style="color:#fbbf24;">Subsystem<div class="eld-note">2=GUI · 3=CUI · 9=WinCE</div></div>
        <div class="eld-cell eld-w2" style="color:#fbbf24; font-weight:700;">DllCharacteristics<div class="eld-note">0x0040=ASLR · 0x0100=NX · 0x0400=no-SEH · 0x4000=CFG — missing ASLR/NX = red flag</div></div>
      </div>
      <div class="eld-row" style="background:#0e2a14;">
        <div class="eld-cell eld-w2" style="color:#a9b7c6;">SizeOfStackReserve</div>
        <div class="eld-cell eld-w2" style="color:#a9b7c6;">SizeOfStackCommit</div>
      </div>
      <div class="eld-row" style="background:#0e2a14;">
        <div class="eld-cell eld-w2" style="color:#a9b7c6;">SizeOfHeapReserve</div>
        <div class="eld-cell eld-w2" style="color:#a9b7c6;">SizeOfHeapCommit</div>
      </div>
      <div class="eld-row" style="background:#0e2a14;">
        <div class="eld-cell eld-w2" style="color:#555; font-style:italic;">LoaderFlags<div class="eld-note">reserved — must be 0</div></div>
        <div class="eld-cell eld-w2" style="color:#6ee7b7; font-weight:700;">NumberOfRvaAndSizes<div class="eld-note">always 16 — number of Data Directory entries that follow</div></div>
      </div>
    </div>
    <div class="eld-region" style="background:#071a0e; border-left:3px solid #86efac;">
      <span class="eld-region-text" style="color:#86efac;">Optional Header (Windows)</span>
    </div>
  </div>

  <!-- ── Data Directories ───────────────────────────────── -->
  <div class="eld-block">
    <div class="eld-fields">
      <div class="eld-label" style="background:#1a0a30; color:#c084fc;">Data Directories — IMAGE_DATA_DIRECTORY × 16 (each: 4-byte RVA + 4-byte Size)</div>
      <div class="eld-row" style="background:#200d3a;">
        <div class="eld-cell eld-w2" style="color:#c084fc; font-weight:700;">ExportTable (RVA)<div class="eld-note">DLL function exports — walking this manually is how shellcode resolves APIs</div></div>
        <div class="eld-cell eld-w2" style="color:#a78bfa;">SizeOfExportTable</div>
      </div>
      <div class="eld-row" style="background:#200d3a;">
        <div class="eld-cell eld-w2" style="color:#c084fc; font-weight:700;">ImportTable (RVA)<div class="eld-note">array of IMAGE_IMPORT_DESCRIPTOR — tells loader which DLLs and functions to bind. Minimal = only LoadLibrary/GetProcAddress = runtime resolution.</div></div>
        <div class="eld-cell eld-w2" style="color:#a78bfa;">SizeOfImportTable</div>
      </div>
      <div class="eld-row" style="background:#200d3a;">
        <div class="eld-cell eld-w2" style="color:#c084fc;">ResourceTable (RVA)<div class="eld-note">.rsrc section root — RCDATA/BITMAP resources often carry encrypted shellcode</div></div>
        <div class="eld-cell eld-w2" style="color:#a78bfa;">SizeOfResourceTable</div>
      </div>
      <div class="eld-row" style="background:#200d3a;">
        <div class="eld-cell eld-w2" style="color:#c084fc;">ExceptionTable (RVA)<div class="eld-note">x64 structured exception handlers (PDATA section)</div></div>
        <div class="eld-cell eld-w2" style="color:#a78bfa;">SizeOfExceptionTable</div>
      </div>
      <div class="eld-row" style="background:#200d3a;">
        <div class="eld-cell eld-w2" style="color:#c084fc; font-weight:700;">CertificateTable (RVA)<div class="eld-note">Authenticode signature — file offset (not RVA!). Stolen/weak cert = stomped signature. Verify with sigcheck -a.</div></div>
        <div class="eld-cell eld-w2" style="color:#a78bfa;">SizeOfCertificateTable</div>
      </div>
      <div class="eld-row" style="background:#200d3a;">
        <div class="eld-cell eld-w2" style="color:#c084fc;">BaseRelocationTable (RVA)<div class="eld-note">.reloc section — required if ASLR rebase is needed</div></div>
        <div class="eld-cell eld-w2" style="color:#a78bfa;">SizeOfBaseRelocationTable</div>
      </div>
      <div class="eld-row" style="background:#200d3a;">
        <div class="eld-cell eld-w2" style="color:#c084fc;">Debug (RVA)</div>
        <div class="eld-cell eld-w2" style="color:#a78bfa;">SizeOfDebug</div>
      </div>
      <div class="eld-row" style="background:#200d3a;">
        <div class="eld-cell eld-w2" style="color:#555; font-style:italic;">Architecture (RVA)<div class="eld-note">reserved — must be zero</div></div>
        <div class="eld-cell eld-w2" style="color:#555; font-style:italic;">SizeOfArchitecture</div>
      </div>
      <div class="eld-row" style="background:#200d3a;">
        <div class="eld-cell eld-w2" style="color:#555; font-style:italic;">GlobalPtr (RVA)<div class="eld-note">MIPS/IA-64 global pointer only</div></div>
        <div class="eld-cell eld-w2" style="color:#2a2a3a; font-style:italic;">0x00 0x00 0x00 0x00</div>
      </div>
      <div class="eld-row" style="background:#200d3a;">
        <div class="eld-cell eld-w2" style="color:#c084fc; font-weight:700;">TLSTable (RVA)<div class="eld-note">IMAGE_TLS_DIRECTORY — callbacks here run BEFORE AddressOfEntryPoint. Primary anti-analysis and persistence technique.</div></div>
        <div class="eld-cell eld-w2" style="color:#a78bfa;">SizeOfTLSTable</div>
      </div>
      <div class="eld-row" style="background:#200d3a;">
        <div class="eld-cell eld-w2" style="color:#c084fc;">LoadConfigTable (RVA)<div class="eld-note">CFG bitmap, SE handler table, stack cookie</div></div>
        <div class="eld-cell eld-w2" style="color:#a78bfa;">SizeOfLoadConfigTable</div>
      </div>
      <div class="eld-row" style="background:#200d3a;">
        <div class="eld-cell eld-w2" style="color:#c084fc;">BoundImport (RVA)</div>
        <div class="eld-cell eld-w2" style="color:#a78bfa;">SizeOfBoundImport</div>
      </div>
      <div class="eld-row" style="background:#200d3a;">
        <div class="eld-cell eld-w2" style="color:#c084fc; font-weight:700;">ImportAddressTable (RVA)<div class="eld-note">IAT — this is what gets patched at load time (and what API hooks overwrite at runtime)</div></div>
        <div class="eld-cell eld-w2" style="color:#a78bfa;">SizeOfImportAddressTable</div>
      </div>
      <div class="eld-row" style="background:#200d3a;">
        <div class="eld-cell eld-w2" style="color:#c084fc;">DelayImportDescriptor (RVA)<div class="eld-note">delay-loaded imports — resolved on first call</div></div>
        <div class="eld-cell eld-w2" style="color:#a78bfa;">SizeOfDelayImportDescriptor</div>
      </div>
      <div class="eld-row" style="background:#200d3a;">
        <div class="eld-cell eld-w2" style="color:#c084fc;">.NET / CLRRuntimeHeader (RVA)<div class="eld-note">present in managed .NET executables</div></div>
        <div class="eld-cell eld-w2" style="color:#a78bfa;">SizeOfCLRRuntimeHeader</div>
      </div>
      <div class="eld-row" style="background:#200d3a;">
        <div class="eld-cell eld-w4" style="color:#2a2a3a; font-style:italic;">Reserved — 0x00 0x00 0x00 0x00 0x00 0x00 0x00 0x00</div>
      </div>
    </div>
    <div class="eld-region" style="background:#130820; border-left:3px solid #c084fc;">
      <span class="eld-region-text" style="color:#c084fc;">Data Directories</span>
    </div>
  </div>

  <!-- ── Section Headers ────────────────────────────────── -->
  <div class="eld-block">
    <div class="eld-fields">
      <div class="eld-label" style="background:#2a0a2a; color:#e879f9;">Section Headers — IMAGE_SECTION_HEADER × NumberOfSections (40 bytes each)</div>
      <div class="eld-row" style="background:#350d35;">
        <div class="eld-cell eld-w4" style="color:#e879f9; font-weight:700;">Name[8] — 8 ASCII bytes, null-padded<div class="eld-note">Common names: .text · .rdata · .data · .rsrc · .reloc · .pdata · .tls — name is cosmetic only; Characteristics flags define actual permissions.</div></div>
      </div>
      <div class="eld-row" style="background:#350d35;">
        <div class="eld-cell eld-w2" style="color:#c084fc;">VirtualSize<div class="eld-note">actual used size in memory. VirtualSize >> SizeOfRawData = compressed/packed data inside.</div></div>
        <div class="eld-cell eld-w2" style="color:#c084fc;">VirtualAddress (RVA)<div class="eld-note">where section is mapped in memory relative to ImageBase</div></div>
      </div>
      <div class="eld-row" style="background:#350d35;">
        <div class="eld-cell eld-w2" style="color:#a78bfa;">SizeOfRawData<div class="eld-note">aligned to FileAlignment — size of section on disk</div></div>
        <div class="eld-cell eld-w2" style="color:#a78bfa;">PointerToRawData<div class="eld-note">file offset where section data starts — check for overlay past last section</div></div>
      </div>
      <div class="eld-row" style="background:#350d35;">
        <div class="eld-cell eld-w2" style="color:#555; font-style:italic;">PointerToRelocations<div class="eld-note">object files only — 0 in executables</div></div>
        <div class="eld-cell eld-w2" style="color:#555; font-style:italic;">PointerToLinenumbers<div class="eld-note">deprecated — always 0</div></div>
      </div>
      <div class="eld-row" style="background:#350d35;">
        <div class="eld-cell" style="color:#555; font-style:italic;">NumberOfRelocations</div>
        <div class="eld-cell" style="color:#555; font-style:italic;">NumberOfLinenumbers</div>
        <div class="eld-cell eld-w2" style="color:#fbbf24; font-weight:700;">Characteristics<div class="eld-note">0x20=code · 0x40=init.data · 0x80=uninit.data · 0x20000000=execute · 0x40000000=read · 0x80000000=write — WRITE+EXECUTE together = red flag</div></div>
      </div>
      <div class="eld-row" style="background:#350d35; padding:4px 10px; color:#5a3a5a; font-style:italic;">
        ··· one 40-byte entry repeated for every section (NumberOfSections total) ···
      </div>
    </div>
    <div class="eld-region" style="background:#1c071c; border-left:3px solid #e879f9;">
      <span class="eld-region-text" style="color:#e879f9;">Section Headers</span>
    </div>
  </div>

</div>

### PE Hex View Mockup

The annotated hex below shows the first <span class="addr">0x90</span> bytes of a minimal PE. The MZ magic at <span class="addr">0x00</span>, the `e_lfanew` pointer at <span class="addr">0x3C</span> pointing to <span class="addr">0x80</span>, and the PE signature at <span class="addr">0x80</span> are the three anchors every analyst reads first.

<style>
.pe-hex-mock { background:#1e1f22; border:1px solid #3a3a3a; border-radius:6px; margin:24px 0; font-family:'Consolas','Monaco','Courier New',monospace; font-size:12.5px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.6); }
.phm-bar { background:#2d2d2d; padding:5px 14px; color:#777; font-size:11px; border-bottom:1px solid #3a3a3a; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
.phm-body { padding:8px 0; }
.phm-row { display:flex; gap:0; padding:2px 14px; align-items:baseline; }
.phm-row:hover { background:rgba(255,255,255,0.04); }
.phm-off  { color:#7a6faa; min-width:60px; }
.phm-hex  { color:#a9b7c6; min-width:320px; letter-spacing:0.08em; line-height:1.6; }
.phm-mz   { color:#f85149; font-weight:700; }
.phm-sig  { color:#4ec9b0; font-weight:700; }
.phm-ptr  { color:#ffc66d; font-weight:700; }
.phm-zero { color:#3a3a3a; }
.phm-stub { color:#5c7d47; }
.phm-ann  { color:#629755; font-style:italic; font-size:11px; margin-left:16px; white-space:nowrap; }
.phm-sep  { border-top:1px solid #2a2a2a; margin:4px 0; }
</style>
<div class="pe-hex-mock">
  <div class="phm-bar">Hex view — minimal PE (first 0x90 bytes) &nbsp;·&nbsp; offsets in hex</div>
  <div class="phm-body">
    <div class="phm-row">
      <span class="phm-off">0000</span>
      <span class="phm-hex"><span class="phm-mz">4D 5A</span> 90 00 03 00 00 00 04 00 00 00 FF FF 00 00</span>
      <span class="phm-ann">← MZ magic (e_magic = 0x5A4D)</span>
    </div>
    <div class="phm-row">
      <span class="phm-off">0010</span>
      <span class="phm-hex"><span class="phm-stub">B8 00 00 00 00 00 00 00 40 00 00 00 00 00 00 00</span></span>
      <span class="phm-ann">DOS header fields</span>
    </div>
    <div class="phm-row">
      <span class="phm-off">0020</span>
      <span class="phm-hex"><span class="phm-zero">00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00</span></span>
      <span class="phm-ann">reserved (e_res[])</span>
    </div>
    <div class="phm-row">
      <span class="phm-off">0030</span>
      <span class="phm-hex"><span class="phm-zero">00 00 00 00 00 00 00 00 00 00 00 00</span> <span class="phm-ptr">80 00 00 00</span></span>
      <span class="phm-ann">← e_lfanew = 0x80 (PE signature offset)</span>
    </div>
    <div class="phm-sep"></div>
    <div class="phm-row">
      <span class="phm-off">0040</span>
      <span class="phm-hex"><span class="phm-stub">0E 1F BA 0E 00 B4 09 CD 21 B8 01 4C CD 21 54 68</span></span>
      <span class="phm-ann">DOS stub — INT 21h exit routine</span>
    </div>
    <div class="phm-row">
      <span class="phm-off">0050</span>
      <span class="phm-hex"><span class="phm-stub">69 73 20 70 72 6F 67 72 61 6D 20 63 61 6E 6E 6F</span></span>
      <span class="phm-ann">"is program canno" (DOS stub string)</span>
    </div>
    <div class="phm-row">
      <span class="phm-off">0060</span>
      <span class="phm-hex"><span class="phm-stub">74 20 62 65 20 72 75 6E 20 69 6E 20 44 4F 53 20</span></span>
      <span class="phm-ann">"t be run in DOS "</span>
    </div>
    <div class="phm-row">
      <span class="phm-off">0070</span>
      <span class="phm-hex"><span class="phm-stub">6D 6F 64 65 2E 0D 0D 0A 24 00 00 00 00 00 00 00</span></span>
      <span class="phm-ann">"mode..." + $ terminator</span>
    </div>
    <div class="phm-sep"></div>
    <div class="phm-row">
      <span class="phm-off">0080</span>
      <span class="phm-hex"><span class="phm-sig">50 45 00 00</span> 4C 01 03 00 <span class="phm-ptr">A3 F8 4B 5E</span> 00 00 00 00</span>
      <span class="phm-ann">← PE\0\0 signature + Machine=0x014C (x86) + TimeDateStamp</span>
    </div>
    <div class="phm-row">
      <span class="phm-off">0090</span>
      <span class="phm-hex"><span class="phm-zero">00 00 00 00</span> <span class="phm-stub">E0 00</span> <span class="phm-ptr">02 01</span> <span class="phm-zero">00 00 00 00 00 00 00 00</span></span>
      <span class="phm-ann">SizeOfOptionalHeader=0xE0, Characteristics=0x0102 (EXE+32bit)</span>
    </div>
  </div>
</div>

---

## ELF Headers — Linux / Android / Embedded

The Executable and Linkable Format is the standard binary format on Linux, Android (native code), BSD, and most embedded systems. Its design is more orthogonal than PE: it separates the **runtime view** (program headers / segments) from the **linker view** (section headers), and the two can be partially inconsistent — a property malware exploits.

### ELF Ident — The First 16 Bytes

The binary opens with a 16-byte identification array (`e_ident`) that is architecture-independent:

| Offset | Length | Field | Typical value |
|---|---|---|---|
| 0 | 4 | Magic | <span class="addr">7F 45 4C 46</span> (`\x7fELF`) |
| 4 | 1 | Class | `01` = ELF32, `02` = ELF64 |
| 5 | 1 | Data | `01` = LSB (little-endian), `02` = MSB |
| 6 | 1 | Version | `01` (always 1) |
| 7 | 1 | OS/ABI | `00` = System V, `03` = Linux, `09` = FreeBSD |
| 8 | 1 | ABI version | `00` (unused by most OSes) |
| 9 | 7 | Padding | all zeros |

The magic bytes <span class="addr">7F 45 4C 46</span> are non-printable followed by `ELF` in ASCII. The kernel checks these first and returns `ENOEXEC` if they are wrong. Malware that scrambles ELF headers after loading itself into memory relies on having already invoked `mmap`/`mprotect` before the header is checked again.

### ELF Header Fields (`Elf64_Ehdr`)

After the 16-byte ident, the remaining header fields are architecture-width-dependent. For ELF64:

- **`e_type`** — binary type. <span class="addr">0x0002</span> = `ET_EXEC` (position-dependent executable), <span class="addr">0x0003</span> = `ET_DYN` (position-independent executable or shared library), <span class="addr">0x0004</span> = `ET_CORE` (core dump). Modern Linux binaries compiled with `-fPIE -pie` are `ET_DYN` even when they are executables, not shared libraries — this is intentional for ASLR support.
- **`e_machine`** — target architecture: <span class="addr">0x0003</span> = x86, <span class="addr">0x003E</span> = x86-64, <span class="addr">0x0028</span> = ARM (32-bit), <span class="addr">0x00B7</span> = AArch64, <span class="addr">0x00F3</span> = RISC-V.
- **`e_entry`** — virtual address of the entry point (`_start`, which calls `__libc_start_main`). Stripped binaries still have a valid entry address; it is one of the first symbols reconstructed during analysis.
- **`e_phoff`** — file offset of the Program Header Table. For a standard ELF64 this is <span class="addr">0x40</span> (immediately after the ELF header).
- **`e_shoff`** — file offset of the Section Header Table. Malware routinely zeros this field to break static analysis tools that rely on sections; the binary still executes normally because the runtime loader only needs program headers.
- **`e_phnum`** / **`e_shnum`** — counts of program headers and section headers. Injecting extra program headers requires incrementing `e_phnum` and adding entries before the existing ones (since the kernel iterates from 0 to `e_phnum`).
- **`e_shstrndx`** — index of the section containing section name strings. If `e_shoff` is zero, this field is meaningless.

### Program Headers (Segments — Runtime View)

The program header table is what the kernel and dynamic linker read at load time. Each entry describes a **segment** — a contiguous region of the file mapped into a contiguous region of memory. The segment types most relevant to analysis:

**`PT_LOAD`** — loadable segment. The kernel calls `mmap` for each one. A standard binary has two: one `R-X` (code, including `.text`) and one `RW-` (data, including `.data`/`.bss`). Each entry specifies `p_offset` (file offset), `p_vaddr` (virtual address), `p_filesz` (bytes from file), `p_memsz` (bytes in memory — may be larger for BSS), and `p_flags` (`PF_R=4`, `PF_W=2`, `PF_X=1`). A `PT_LOAD` with flags `RWX` (7) is an unconditional red flag — no legitimate binary needs a simultaneously writable and executable segment.

**`PT_DYNAMIC`** — points to the `.dynamic` section, which contains the dynamic linking metadata (`DT_NEEDED` entries, GOT/PLT addresses, symbol table pointers). Without this segment the dynamic linker cannot resolve imports.

**`PT_INTERP`** — path to the dynamic linker, typically `/lib64/ld-linux-x86-64.so.2` or `/lib/ld-linux.so.2` for 32-bit. Statically linked binaries have no `PT_INTERP`. An unusual path here (e.g., `/tmp/.x/ld.so` or a path in `/dev/shm`) means the attacker is supplying a custom loader — a sophisticated technique used by some rootkits.

**`PT_GNU_STACK`** — the `p_flags` of this segment control the NX policy for the stack. A legitimate binary has `RW-` (flags=6, no execute). If `PF_X` is set (flags=7), the stack is executable — either the binary uses intentional stack execution (rare, legacy) or the attacker cleared the NX protection to enable shellcode on the stack. `checksec` and `readelf -l` both show this.

**`PT_GNU_RELRO`** — marks a range of the address space as read-only after dynamic linking completes (`.got`, parts of `.data`). Its absence means GOT entries remain writable throughout execution — enabling GOT overwrite attacks.

### Section Headers (Linker View)

Section headers are a map of the binary's internal structure for linkers and debuggers. The kernel **does not need them** at runtime. This means stripping them (`strip --strip-all`) produces a fully functional binary that is harder to analyze. Malware distributed in the wild is almost always stripped.

Important sections:

- **`.text`** — machine code. `SHT_PROGBITS`, flags `AX` (alloc + execute).
- **`.rodata`** — read-only data: string literals, jump tables, constant arrays.
- **`.data`** / **`.bss`** — initialized and uninitialized writable data.
- **`.dynamic`** — the `Elf64_Dyn` array driving dynamic linking.
- **`.dynsym`** + **`.dynstr`** — the minimal symbol table needed for dynamic linking. Always present in dynamically linked binaries (cannot be stripped without breaking the binary).
- **`.symtab`** + **`.strtab`** — the full symbol table. Stripped in production/malware releases. Their presence is a debugging artifact.
- **`.got`** — Global Offset Table. At load time the dynamic linker patches pointers here for each resolved symbol. GOT overwrite (writing a function pointer to redirect execution) is a well-known post-exploitation technique.
- **`.plt`** — Procedure Linkage Table. A table of small stubs; each stub either jumps through the GOT (resolved) or calls the lazy binding resolver. The PLT is in the executable segment and is never writable.
- **`.rela.plt`** / **`.rela.dyn`** — relocation tables describing which GOT slots to patch and with which symbols.
- **`.init_array`** — array of constructor function pointers called before `main()`. Functionally equivalent to PE TLS callbacks. Malware that installs itself as a shared library can hide in `.init_array` entries.

### Dynamic Linking Deep-Dive

The `PT_DYNAMIC` segment contains a flat array of `(tag, value)` pairs called `Elf64_Dyn`:

- **`DT_NEEDED`** — one entry per required shared library (`libc.so.6`, `libpthread.so.0`, etc.). A binary with no `DT_NEEDED` entries is statically linked. Malware often has minimal `DT_NEEDED` entries or none, carrying all code statically.
- **`DT_RPATH`** / **`DT_RUNPATH`** — colon-separated list of paths searched for shared libraries before the system defaults. If this contains a writable path (e.g., `.`, `/tmp`, `/home/user`) an attacker can plant a malicious library with the same `DT_SONAME` as a legitimate one and hijack every import.
- **`DT_SONAME`** — the library's own name, used when other binaries `DT_NEEDED` reference it.

**How PLT/GOT lazy binding works:** on the first call to `printf`, the PLT stub jumps to GOT entry `[printf]`. Initially that GOT entry points back into the PLT resolver stub, which calls `_dl_runtime_resolve`. The dynamic linker finds the real `printf` address and patches the GOT entry. Every subsequent call jumps directly to libc. This lazy resolution mechanism means the GOT is writable during program execution — making it a target for any attacker with a write primitive.

### ELF File Structure Layout

The diagram below shows the complete ELF64 file layout from byte 0 to the Section Header Table, with every major field colour-coded by region. The right-side bar names each region as the loader and linker see it.

<style>
.elf-layout-diagram {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #111;
  box-shadow: 0 8px 32px rgba(0,0,0,0.8);
  margin: 28px 0;
  line-height: 1.4;
}
.eld-block {
  display: grid;
  grid-template-columns: 1fr 110px;
  border-bottom: 2px solid rgba(0,0,0,0.6);
}
.eld-block:last-child { border-bottom: none; }
.eld-region {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 4px;
}
.eld-region-text {
  writing-mode: vertical-lr;
  transform: rotate(180deg);
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.07em;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  text-align: center;
}
.eld-label {
  text-align: center;
  padding: 7px 14px;
  font-size: 1.0em;
  font-weight: 700;
  letter-spacing: 0.08em;
  border-bottom: 1px solid rgba(0,0,0,0.4);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
.eld-row {
  display: flex;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.eld-row:last-child { border-bottom: none; }
.eld-cell {
  flex: 1;
  padding: 6px 10px;
  border-right: 1px solid rgba(255,255,255,0.05);
  min-width: 0;
}
.eld-cell:last-child { border-right: none; }
.eld-note { font-size: 10px; color: #555; margin-top: 2px; font-style: italic; }
.eld-w2 { flex: 2; }
.eld-w3 { flex: 3; }
.eld-w4 { flex: 4; }
</style>

<div class="elf-layout-diagram">

  <!-- ── ELF Ident ─────────────────────────────────────── -->
  <div class="eld-block">
    <div class="eld-fields">
      <div class="eld-label" style="background:#093530; color:#4ec9b0;">ELF Ident — e_ident[EI_NIDENT] (16 bytes, offset 0x00)</div>
      <div class="eld-row" style="background:#0b3d36;">
        <div class="eld-cell eld-w2" style="color:#f85149; font-weight:700;">Magic: 7f 45 4c 46<div class="eld-note">"\x7fELF" — loader rejects file if absent</div></div>
        <div class="eld-cell" style="color:#ffc66d;">Class<div class="eld-note">1 = ELF32 / 2 = ELF64</div></div>
        <div class="eld-cell" style="color:#9a8cd4;">Data<div class="eld-note">1 = LE / 2 = BE</div></div>
        <div class="eld-cell" style="color:#5dba7c;">EI_VERSION<div class="eld-note">always 1</div></div>
        <div class="eld-cell" style="color:#f97316;">OS/ABI<div class="eld-note">0 = SysV / 3 = Linux</div></div>
      </div>
      <div class="eld-row" style="background:#0b3d36;">
        <div class="eld-cell" style="color:#60a5fa;">ABI Version<div class="eld-note">usually 0</div></div>
        <div class="eld-cell eld-w4" style="color:#2a4a3a; font-style:italic;">EI_PAD — 7 reserved zero bytes</div>
      </div>
    </div>
    <div class="eld-region" style="background:#062820; border-left:3px solid #4ec9b0;">
      <span class="eld-region-text" style="color:#4ec9b0;">ELF Ident</span>
    </div>
  </div>

  <!-- ── ELF Header fields ──────────────────────────────── -->
  <div class="eld-block">
    <div class="eld-fields">
      <div class="eld-label" style="background:#0a1f3a; color:#60a5fa;">ELF Header Fields — Elf64_Ehdr (offset 0x10 → 0x3F)</div>
      <div class="eld-row" style="background:#0d2545;">
        <div class="eld-cell" style="color:#60a5fa; font-weight:700;">e_type<div class="eld-note">2 = ET_EXEC / 3 = ET_DYN / 4 = ET_CORE</div></div>
        <div class="eld-cell" style="color:#f85149; font-weight:700;">e_machine<div class="eld-note">0x03 = x86 · 0x3E = AMD64 · 0x28 = ARM · 0xB7 = AArch64</div></div>
        <div class="eld-cell" style="color:#a9b7c6;">e_version<div class="eld-note">always 1</div></div>
      </div>
      <div class="eld-row" style="background:#0d2545;">
        <div class="eld-cell eld-w4" style="color:#fbbf24; font-weight:700;">e_entry — entry point virtual address (8 bytes)<div class="eld-note">Where execution starts. Shellcode loaders jump here directly.</div></div>
      </div>
      <div class="eld-row" style="background:#0d2545;">
        <div class="eld-cell eld-w4" style="color:#a78bfa;">e_phoff — Program Header Table file offset (8 bytes)<div class="eld-note">Typically 0x40 (immediately after this header). The runtime loader uses only this — not e_shoff.</div></div>
      </div>
      <div class="eld-row" style="background:#0d2545;">
        <div class="eld-cell eld-w4" style="color:#34d399;">e_shoff — Section Header Table file offset (8 bytes)<div class="eld-note">Zeroed by packers and malware to defeat readelf / static analysis. Binary still executes normally.</div></div>
      </div>
      <div class="eld-row" style="background:#0d2545;">
        <div class="eld-cell" style="color:#a9b7c6;">e_flags<div class="eld-note">arch flags</div></div>
        <div class="eld-cell" style="color:#a9b7c6;">e_ehsize<div class="eld-note">64 bytes</div></div>
        <div class="eld-cell" style="color:#a9b7c6;">e_phentsize<div class="eld-note">56 bytes</div></div>
        <div class="eld-cell" style="color:#a9b7c6;">e_phnum<div class="eld-note"># program headers</div></div>
      </div>
      <div class="eld-row" style="background:#0d2545;">
        <div class="eld-cell" style="color:#a9b7c6;">e_shentsize<div class="eld-note">64 bytes</div></div>
        <div class="eld-cell" style="color:#a9b7c6;">e_shnum<div class="eld-note"># section headers</div></div>
        <div class="eld-cell eld-w2" style="color:#ffc66d;">e_shstrndx<div class="eld-note">section index of .shstrtab (section-name string table)</div></div>
      </div>
    </div>
    <div class="eld-region" style="background:#071428; border-left:3px solid #60a5fa;">
      <span class="eld-region-text" style="color:#60a5fa;">ELF Header</span>
    </div>
  </div>

  <!-- ── Program Header Table ──────────────────────────── -->
  <div class="eld-block">
    <div class="eld-fields">
      <div class="eld-label" style="background:#0a2a10; color:#4ade80;">Program Header Table — Elf64_Phdr × e_phnum (runtime / loader view)</div>
      <div class="eld-row" style="background:#0d3515;">
        <div class="eld-cell" style="color:#4ade80; font-weight:700;">PT_PHDR</div>
        <div class="eld-cell" style="color:#60a5fa;">PF_R</div>
        <div class="eld-cell eld-w2" style="color:#a9b7c6;">location of the program header table itself</div>
      </div>
      <div class="eld-row" style="background:#0d3515;">
        <div class="eld-cell" style="color:#fbbf24; font-weight:700;">PT_INTERP</div>
        <div class="eld-cell" style="color:#60a5fa;">PF_R</div>
        <div class="eld-cell eld-w2" style="color:#f97316;">/lib64/ld-linux-x86-64.so.2<div class="eld-note">path to dynamic linker — unusual path = library hijack attempt</div></div>
      </div>
      <div class="eld-row" style="background:#0d3515;">
        <div class="eld-cell" style="color:#4ec9b0; font-weight:700;">PT_LOAD [0]<div class="eld-note">code segment</div></div>
        <div class="eld-cell" style="color:#4ade80; font-weight:600;">PF_R | PF_X<div class="eld-note">Read + eXecute</div></div>
        <div class="eld-cell eld-w2" style="color:#a9b7c6;">maps .text + .rodata + .plt into memory (never writable)</div>
      </div>
      <div class="eld-row" style="background:#0d3515;">
        <div class="eld-cell" style="color:#4ec9b0; font-weight:700;">PT_LOAD [1]<div class="eld-note">data segment</div></div>
        <div class="eld-cell" style="color:#f97316; font-weight:600;">PF_R | PF_W<div class="eld-note">Read + Write</div></div>
        <div class="eld-cell eld-w2" style="color:#a9b7c6;">maps .data + .bss + .dynamic + .got into memory</div>
      </div>
      <div class="eld-row" style="background:#0d3515;">
        <div class="eld-cell" style="color:#c084fc; font-weight:700;">PT_DYNAMIC</div>
        <div class="eld-cell" style="color:#f97316;">PF_R | PF_W</div>
        <div class="eld-cell eld-w2" style="color:#a9b7c6;">points to .dynamic section — DT_NEEDED, DT_RPATH, DT_INIT_ARRAY…</div>
      </div>
      <div class="eld-row" style="background:#0d3515;">
        <div class="eld-cell" style="color:#f85149; font-weight:700;">PT_GNU_STACK<div class="eld-note">NX control</div></div>
        <div class="eld-cell" style="color:#4ade80; font-weight:600;">PF_R | PF_W<div class="eld-note">NX = ON ✓</div></div>
        <div class="eld-cell eld-w2" style="color:#a9b7c6;">If <span style="color:#f85149; font-weight:700;">PF_X is present here</span> → stack is executable → NX disabled → shellcode on stack possible</div>
      </div>
      <div class="eld-row" style="background:#0d3515;">
        <div class="eld-cell" style="color:#38bdf8; font-weight:700;">PT_GNU_RELRO</div>
        <div class="eld-cell" style="color:#60a5fa;">PF_R</div>
        <div class="eld-cell eld-w2" style="color:#a9b7c6;">pages marked read-only after relocation (protects .got from runtime overwrites if Full RELRO)</div>
      </div>
    </div>
    <div class="eld-region" style="background:#071a0a; border-left:3px solid #4ade80;">
      <span class="eld-region-text" style="color:#4ade80;">Program Headers</span>
    </div>
  </div>

  <!-- ── Code sections ─────────────────────────────────── -->
  <div class="eld-block">
    <div class="eld-fields">
      <div class="eld-label" style="background:#1a0a30; color:#c084fc;">Sections — Code (SHF_ALLOC | SHF_EXECINSTR)</div>
      <div class="eld-row" style="background:#200d3a;">
        <div class="eld-cell" style="color:#c084fc; font-weight:700;">.text<div class="eld-note">SHT_PROGBITS · AX</div></div>
        <div class="eld-cell" style="color:#4ade80; font-weight:600;">PF_R | PF_X</div>
        <div class="eld-cell eld-w2" style="color:#a9b7c6;">compiled machine code — the function bodies</div>
      </div>
      <div class="eld-row" style="background:#200d3a;">
        <div class="eld-cell" style="color:#a78bfa; font-weight:700;">.plt<div class="eld-note">SHT_PROGBITS · AX</div></div>
        <div class="eld-cell" style="color:#4ade80; font-weight:600;">PF_R | PF_X</div>
        <div class="eld-cell eld-w2" style="color:#a9b7c6;">Procedure Linkage Table — small stubs that jump through the GOT to resolve dynamic symbols</div>
      </div>
    </div>
    <div class="eld-region" style="background:#130820; border-left:3px solid #c084fc;">
      <span class="eld-region-text" style="color:#c084fc;">Code Sections</span>
    </div>
  </div>

  <!-- ── Read-only data ────────────────────────────────── -->
  <div class="eld-block">
    <div class="eld-fields">
      <div class="eld-label" style="background:#1e1c08; color:#fde68a;">Sections — Read-Only Data (SHF_ALLOC, not writable)</div>
      <div class="eld-row" style="background:#252218;">
        <div class="eld-cell" style="color:#fde68a; font-weight:700;">.rodata<div class="eld-note">SHT_PROGBITS · A</div></div>
        <div class="eld-cell" style="color:#60a5fa; font-weight:600;">PF_R only</div>
        <div class="eld-cell eld-w2" style="color:#a9b7c6;">string literals, jump tables, const arrays — mapped in the same RX segment as .text</div>
      </div>
    </div>
    <div class="eld-region" style="background:#141207; border-left:3px solid #fde68a;">
      <span class="eld-region-text" style="color:#fde68a;">.rodata</span>
    </div>
  </div>

  <!-- ── Writable data ─────────────────────────────────── -->
  <div class="eld-block">
    <div class="eld-fields">
      <div class="eld-label" style="background:#2a0a0a; color:#f87171;">Sections — Writable Data (SHF_ALLOC | SHF_WRITE)</div>
      <div class="eld-row" style="background:#350d0d;">
        <div class="eld-cell" style="color:#f87171; font-weight:700;">.data<div class="eld-note">SHT_PROGBITS · WA</div></div>
        <div class="eld-cell" style="color:#f97316; font-weight:600;">PF_R | PF_W</div>
        <div class="eld-cell eld-w2" style="color:#a9b7c6;">initialized global and static variables</div>
      </div>
      <div class="eld-row" style="background:#350d0d;">
        <div class="eld-cell" style="color:#fca5a5; font-weight:700;">.bss<div class="eld-note">SHT_NOBITS · WA</div></div>
        <div class="eld-cell" style="color:#f97316; font-weight:600;">PF_R | PF_W</div>
        <div class="eld-cell eld-w2" style="color:#a9b7c6;">uninitialized globals — zero file size, zeroed by loader at map time</div>
      </div>
    </div>
    <div class="eld-region" style="background:#1c0707; border-left:3px solid #f87171;">
      <span class="eld-region-text" style="color:#f87171;">Data Sections</span>
    </div>
  </div>

  <!-- ── Dynamic linking ───────────────────────────────── -->
  <div class="eld-block">
    <div class="eld-fields">
      <div class="eld-label" style="background:#2a1800; color:#fb923c;">Sections — Dynamic Linking</div>
      <div class="eld-row" style="background:#352000;">
        <div class="eld-cell" style="color:#fb923c; font-weight:700;">.dynamic<div class="eld-note">SHT_DYNAMIC · WA</div></div>
        <div class="eld-cell" style="color:#f97316;">PF_R | PF_W</div>
        <div class="eld-cell eld-w2" style="color:#a9b7c6;">Elf64_Dyn tag/value array — DT_NEEDED, DT_RPATH, DT_INIT_ARRAY, DT_SONAME…</div>
      </div>
      <div class="eld-row" style="background:#352000;">
        <div class="eld-cell" style="color:#fbbf24; font-weight:700;">.got / .got.plt<div class="eld-note">SHT_PROGBITS · WA</div></div>
        <div class="eld-cell" style="color:#f97316; font-weight:600;">PF_R | PF_W<div class="eld-note">⚠ writable!</div></div>
        <div class="eld-cell eld-w2" style="color:#a9b7c6;">Global Offset Table — pointer slots patched by loader at runtime. <span style="color:#f85149;">Primary GOT-overwrite exploitation target.</span></div>
      </div>
      <div class="eld-row" style="background:#352000;">
        <div class="eld-cell" style="color:#fcd34d; font-weight:700;">.dynsym<div class="eld-note">SHT_DYNSYM · A</div></div>
        <div class="eld-cell" style="color:#60a5fa;">PF_R</div>
        <div class="eld-cell eld-w2" style="color:#a9b7c6;">minimal symbol table for dynamic linking — cannot be stripped without breaking the binary</div>
      </div>
      <div class="eld-row" style="background:#352000;">
        <div class="eld-cell" style="color:#fde68a; font-weight:700;">.dynstr<div class="eld-note">SHT_STRTAB · A</div></div>
        <div class="eld-cell" style="color:#60a5fa;">PF_R</div>
        <div class="eld-cell eld-w2" style="color:#a9b7c6;">string table backing .dynsym — contains imported symbol and library names</div>
      </div>
      <div class="eld-row" style="background:#352000;">
        <div class="eld-cell" style="color:#fbbf24; font-weight:700;">.rela.plt<div class="eld-note">SHT_RELA · AI</div></div>
        <div class="eld-cell" style="color:#60a5fa;">PF_R</div>
        <div class="eld-cell eld-w2" style="color:#a9b7c6;">relocation entries for PLT GOT slots — which address to patch and with which symbol</div>
      </div>
      <div class="eld-row" style="background:#352000;">
        <div class="eld-cell" style="color:#fbbf24; font-weight:700;">.rela.dyn<div class="eld-note">SHT_RELA · A</div></div>
        <div class="eld-cell" style="color:#60a5fa;">PF_R</div>
        <div class="eld-cell eld-w2" style="color:#a9b7c6;">relocations for non-PLT symbols (global variables, copy relocations)</div>
      </div>
    </div>
    <div class="eld-region" style="background:#1c1000; border-left:3px solid #fb923c;">
      <span class="eld-region-text" style="color:#fb923c;">Dynamic Linking</span>
    </div>
  </div>

  <!-- ── Constructors / Destructors ────────────────────── -->
  <div class="eld-block">
    <div class="eld-fields">
      <div class="eld-label" style="background:#1a2a0a; color:#86efac;">Sections — Constructors &amp; Destructors (run before / after main)</div>
      <div class="eld-row" style="background:#1e3510;">
        <div class="eld-cell" style="color:#86efac; font-weight:700;">.init_array<div class="eld-note">SHT_INIT_ARRAY · WA</div></div>
        <div class="eld-cell" style="color:#f97316;">PF_R | PF_W</div>
        <div class="eld-cell eld-w2" style="color:#a9b7c6;">function pointers called <strong>before main()</strong> — equivalent to PE TLS callbacks. <span style="color:#f85149;">Malware persistence target in shared libraries.</span></div>
      </div>
      <div class="eld-row" style="background:#1e3510;">
        <div class="eld-cell" style="color:#6ee7b7; font-weight:700;">.fini_array<div class="eld-note">SHT_FINI_ARRAY · WA</div></div>
        <div class="eld-cell" style="color:#f97316;">PF_R | PF_W</div>
        <div class="eld-cell eld-w2" style="color:#a9b7c6;">function pointers called after main() returns / at exit()</div>
      </div>
    </div>
    <div class="eld-region" style="background:#101c07; border-left:3px solid #86efac;">
      <span class="eld-region-text" style="color:#86efac;">.init / .fini</span>
    </div>
  </div>

  <!-- ── Symbol tables ─────────────────────────────────── -->
  <div class="eld-block">
    <div class="eld-fields">
      <div class="eld-label" style="background:#202020; color:#9ca3af;">Sections — Full Symbol Table (stripped in malware / production builds)</div>
      <div class="eld-row" style="background:#282828;">
        <div class="eld-cell" style="color:#6b7280; font-weight:700; text-decoration:line-through;">.symtab<div class="eld-note">SHT_SYMTAB · none</div></div>
        <div class="eld-cell" style="color:#4b5563;">—</div>
        <div class="eld-cell eld-w2" style="color:#4b5563;">full symbol table (all function / variable names). Absent in stripped binaries. Presence = debug build or sloppy packer.</div>
      </div>
      <div class="eld-row" style="background:#282828;">
        <div class="eld-cell" style="color:#6b7280; font-weight:700; text-decoration:line-through;">.strtab<div class="eld-note">SHT_STRTAB · none</div></div>
        <div class="eld-cell" style="color:#4b5563;">—</div>
        <div class="eld-cell eld-w2" style="color:#4b5563;">string table backing .symtab — also removed when stripped</div>
      </div>
      <div class="eld-row" style="background:#282828;">
        <div class="eld-cell" style="color:#9ca3af; font-weight:700;">.shstrtab<div class="eld-note">SHT_STRTAB · A</div></div>
        <div class="eld-cell" style="color:#60a5fa;">PF_R</div>
        <div class="eld-cell eld-w2" style="color:#a9b7c6;">section name strings — always present, index stored in e_shstrndx</div>
      </div>
    </div>
    <div class="eld-region" style="background:#141414; border-left:3px solid #6b7280;">
      <span class="eld-region-text" style="color:#6b7280;">Symbol Tables</span>
    </div>
  </div>

  <!-- ── Section Header Table ──────────────────────────── -->
  <div class="eld-block">
    <div class="eld-fields">
      <div class="eld-label" style="background:#2a0a2a; color:#e879f9;">Section Header Table — Elf64_Shdr × e_shnum (64 bytes each)</div>
      <div class="eld-row" style="background:#350d35;">
        <div class="eld-cell" style="color:#e879f9; font-weight:700;">sh_name<div class="eld-note">offset into .shstrtab</div></div>
        <div class="eld-cell" style="color:#c084fc; font-weight:700;">sh_type<div class="eld-note">SHT_PROGBITS / DYNAMIC / NOBITS…</div></div>
        <div class="eld-cell eld-w2" style="color:#a78bfa; font-weight:700;">sh_flags<div class="eld-note">SHF_ALLOC · SHF_WRITE · SHF_EXECINSTR</div></div>
      </div>
      <div class="eld-row" style="background:#350d35;">
        <div class="eld-cell eld-w2" style="color:#a9b7c6;">sh_addr — virtual address in memory</div>
        <div class="eld-cell eld-w2" style="color:#a9b7c6;">sh_offset — file offset of section data</div>
      </div>
      <div class="eld-row" style="background:#350d35;">
        <div class="eld-cell" style="color:#a9b7c6;">sh_size</div>
        <div class="eld-cell" style="color:#a9b7c6;">sh_link</div>
        <div class="eld-cell" style="color:#a9b7c6;">sh_info</div>
        <div class="eld-cell" style="color:#a9b7c6;">sh_addralign</div>
        <div class="eld-cell" style="color:#a9b7c6;">sh_entsize</div>
      </div>
      <div class="eld-row" style="background:#350d35; padding:4px 10px; color:#5a3a5a; font-style:italic;">
        ··· one 64-byte entry repeated for every section (e_shnum total) ···
      </div>
    </div>
    <div class="eld-region" style="background:#1c071c; border-left:3px solid #e879f9;">
      <span class="eld-region-text" style="color:#e879f9;">Section Header Table</span>
    </div>
  </div>

</div>

### ELF Header Hex Mockup

The 64 bytes below are the complete ELF64 header for a typical x86-64 `ET_DYN` binary with a program header table at offset <span class="addr">0x40</span>:

<style>
.elf-mock { background:#1a1f1a; border:1px solid #2a3a2a; border-radius:6px; margin:24px 0; font-family:'Consolas','Monaco','Courier New',monospace; font-size:12.5px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.6); }
.elm-bar  { background:#1e2a1e; padding:5px 14px; color:#5a7a5a; font-size:11px; border-bottom:1px solid #2a3a2a; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
.elm-body { padding:8px 0; }
.elm-row  { display:flex; gap:0; padding:2px 14px; align-items:baseline; }
.elm-row:hover { background:rgba(255,255,255,0.04); }
.elm-off  { color:#7a9a7a; min-width:60px; }
.elm-hex  { color:#a9b7c6; min-width:320px; letter-spacing:0.08em; line-height:1.6; }
.em-magic { color:#4ec9b0; font-weight:700; }
.em-class { color:#ffc66d; font-weight:600; }
.em-data  { color:#9a8cd4; font-weight:600; }
.em-abi   { color:#f97316; }
.em-type  { color:#60a5fa; font-weight:600; }
.em-mach  { color:#f85149; font-weight:600; }
.em-entry { color:#fbbf24; font-weight:700; }
.em-off   { color:#c57d3b; }
.em-cnt   { color:#9cdcfe; }
.em-zero  { color:#2a3a2a; }
.elm-ann  { color:#629755; font-style:italic; font-size:11px; margin-left:16px; white-space:nowrap; }
.elm-sep  { border-top:1px solid #1e2a1e; margin:4px 0; }
</style>
<div class="elf-mock">
  <div class="elm-bar">Hex view — ELF64 header (0x40 bytes) &nbsp;·&nbsp; x86-64 ET_DYN PIE binary</div>
  <div class="elm-body">
    <div class="elm-row">
      <span class="elm-off">0000</span>
      <span class="elm-hex"><span class="em-magic">7F 45 4C 46</span> <span class="em-class">02</span> <span class="em-data">01</span> 01 <span class="em-abi">00</span> <span class="em-zero">00 00 00 00 00 00 00 00</span></span>
      <span class="elm-ann">magic · class=ELF64 · LSB · ver=1 · ABI=SysV · padding</span>
    </div>
    <div class="elm-sep"></div>
    <div class="elm-row">
      <span class="elm-off">0010</span>
      <span class="elm-hex"><span class="em-type">03 00</span> <span class="em-mach">3E 00</span> 01 00 00 00 <span class="em-entry">A0 10 00 00 00 00 00 00</span></span>
      <span class="elm-ann">e_type=ET_DYN · e_machine=x86-64 · e_version=1 · e_entry=0x10A0</span>
    </div>
    <div class="elm-row">
      <span class="elm-off">0020</span>
      <span class="elm-hex"><span class="em-off">40 00 00 00 00 00 00 00</span> <span class="em-off">98 32 00 00 00 00 00 00</span></span>
      <span class="elm-ann">e_phoff=0x40 (PHT right after header) · e_shoff=0x3298</span>
    </div>
    <div class="elm-row">
      <span class="elm-off">0030</span>
      <span class="elm-hex"><span class="em-zero">00 00 00 00</span> <span class="em-cnt">40 00</span> <span class="em-cnt">38 00</span> <span class="em-cnt">0D 00</span> <span class="em-cnt">40 00</span> <span class="em-cnt">1C 00</span> <span class="em-cnt">1B 00</span></span>
      <span class="elm-ann">e_flags=0 · e_ehsize=64 · e_phentsize=56 · e_phnum=13 · e_shentsize=64 · e_shnum=28 · e_shstrndx=27</span>
    </div>
  </div>
</div>

---

## Where Malware Hides — and How to Detect It

### PE Hiding Spots

#### 1. Overlay / Appended Data

After the last section's raw data ends on disk, the PE format has no explicit end-of-file marker. Bytes appended beyond the last section are called the **overlay**. Installers legitimately use this (e.g., self-extracting archives append a ZIP blob), but malware uses it to store encrypted shellcode, config blobs, or secondary payloads that are loaded at runtime via `SetFilePointer` + `ReadFile` at the overlay offset.

Detection: `diec sample.exe`, `binwalk sample.exe`, or `python3 -c "import pefile; p=pefile.PE('sample.exe'); print(p.get_overlay_data_start_offset())"`. Any overlay > a few kilobytes in a binary that isn't a self-extractor deserves scrutiny. Measure entropy of the overlay — random-looking = encrypted.

#### 2. Section Slack Space

The difference between `VirtualSize` and `SizeOfRawData` is zeroed padding on disk. Malware can hide data in this slack between the end of a section's actual content and the next `FileAlignment` boundary. The technique is subtle — the data is present on disk but invisible to most viewers because they only display up to `SizeOfRawData`.

Detection: `pe-sieve --pid <PID>` compares in-memory sections to disk; `hollows-hunter` flags modified regions. Manually: `pefile` in Python can dump raw section bytes beyond the virtual size.

#### 3. TLS Callbacks

Thread Local Storage callbacks (`AddressOfCallBacks` in the TLS directory) are function pointers invoked by the loader for every thread creation — including the initial thread, **before** `AddressOfEntryPoint`. Setting a breakpoint at OEP in a debugger will miss any code in a TLS callback entirely. Packers and anti-debug stubs routinely live here.

Detection: `pescan -t sample.exe` lists TLS callbacks. `capa sample.exe` flags the capability. In x64dbg/WinDbg, the `EntryBreakpointMode` needs to be set to break on TLS callbacks, not just OEP.

#### 4. Resource Section Abuse (`.rsrc`)

The resource section tree is a three-level hierarchy (type → name → language). `RCDATA` and `BITMAP` resource types accept arbitrary binary data. Malware stores encrypted payloads here — the resource subsystem is not scanned by many AV engines, and the data is conveniently extracted at runtime via `FindResource` + `LoadResource` + `LockResource`.

Detection: `ResourceHacker` or `peframe sample.exe` show resource content. Measure entropy per resource — a `BITMAP` entry with entropy > 7.5 and no valid BMP header is a payload. `binwalk -e` can extract embedded blobs.

#### 5. Extra Injected Sections

After hollowing or injection, tools like Process Hacker reveal sections in memory that have no disk counterpart, or sections with names not present in the original binary. On disk, packers append new sections at the end of the section table.

Detection: iterate sections with `pefile` and flag any with `Characteristics & 0xE0000000 == 0xE0000000` (RWX), entropy > 7.0, or names not in the standard set. Compare disk section count to in-memory section count.

#### 6. Import Table Spoofing / Stomping

A loader stub that does all API resolution at runtime only needs two imports: `LoadLibraryA` and `GetProcAddress`. The import table will be almost empty — one or two DLL entries. Everything the binary actually calls is resolved by walking the export table of the loaded DLL manually, like a PEB walk (described in the assembly article).

Detection: `pestudio` Imports view — fewer than five imports total with `LoadLibraryA` + `GetProcAddress` present is a near-certain sign of runtime API resolution. `capa` detects the `peb walk` capability directly.

#### 7. Authenticode Stomping

The `CertificateTable` data directory points to a `WIN_CERTIFICATE` structure appended to the file. Because this data is not mapped into memory and is excluded from the hash Microsoft verifies, an attacker can copy the certificate block from a legitimately signed binary and append it to a malicious one. Many security products check only that `WinVerifyTrust` returns `ERROR_SUCCESS`, not whether the hash matches.

Detection: `sigcheck -a sample.exe` (Sysinternals) shows both the certificate subject and whether the file hash matches. `AuthentiCheck` specifically tests hash validity independent of chain trust.

#### 8. PE Header Erasure After Loading

Some loaders zero out the MZ/PE signature in memory after successfully mapping the binary. This breaks any tool that tries to dump and re-parse the binary from memory (e.g., `procdump`), since the result will not be a valid PE.

Detection: `pe-sieve --pid <PID>` compares disk vs. memory and reports `HEADER_ERASED` findings. The fix is to reconstruct the PE header from the section information still visible in memory.

#### 9. Section Name vs. Characteristics Mismatch

The loader ignores section names — only `Characteristics` flags matter for memory permissions. A packer can name a writable+executable section `.text` to fool analysts and tools that key off the name. Conversely, it can mark the actual `.text` section as non-executable to hide code in `.data`.

Detection: compare every section name to its expected characteristics. Flag any `.text` with write permission or any `.data` with execute permission.

#### 10. Checksum Manipulation

The `CheckSum` field in the Optional Header is a CRC-like value computed over the entire file. The Windows loader ignores it for user-mode EXEs but **validates it for drivers and system DLLs**. A zero or incorrect checksum in a binary claiming to be a Windows system file is a reliable indicator of tampering.

Detection: `MapFileAndCheckSum` (Win32 API) or `pe-bear` recomputes the correct checksum and flags mismatches. All legitimate Windows system DLLs have a valid, non-zero checksum.

---

### ELF Hiding Spots

#### 1. Stripped Symbols

`strip --strip-all` removes `.symtab`, `.strtab`, and debug sections. All function names become `FUN_` addresses in Ghidra or `sub_` in IDA. The binary executes identically — only analysis is impaired.

Detection: `file sample` reports "stripped". `readelf -S sample | grep -E 'symtab|strtab'` returns nothing. The `.dynsym`/`.dynstr` sections remain (they cannot be stripped) and provide a minimal set of exported symbol names as starting points.

#### 2. PT_GNU_STACK RWX

An executable stack allows shellcode injection via stack buffer overflows. Set with `execstack -s sample` or by omitting the `PT_GNU_STACK` segment and relying on the kernel default (which on some older kernels defaults to executable).

Detection: `readelf -l sample | grep GNU_STACK` — check the flags column. `RWE` or `flags: 7` means executable stack. `checksec --file=sample` reports `NX disabled`.

#### 3. GOT/PLT Overwrite

After gaining a write primitive (e.g., format string bug, heap overflow), an attacker overwrites a `.got.plt` entry to redirect the next call to that library function toward shellcode. This is detectable post-exploitation.

Detection: attach `gdb` and compare GOT entries to expected library addresses: `x/gx &puts@got.plt` should resolve to an address within `libc.so`. Values in anonymous memory regions or non-library pages indicate hooking. `checksec` flags RELRO status: `Full RELRO` means GOT is read-only after startup.

#### 4. LD_PRELOAD Hijack

Setting `LD_PRELOAD=/path/to/evil.so` causes the dynamic linker to load that library first, allowing it to intercept any function via symbol override. The system-wide variant uses `/etc/ld.so.preload`. This is the most common persistence mechanism for Linux userland rootkits.

Detection: `cat /etc/ld.so.preload` — should be empty on a clean system. For running processes: `cat /proc/<pid>/maps | grep -v '\.so\.' | grep '\.so'` finds anonymously-loaded shared objects. `strace -e trace=open,openat ls` reveals which libraries are actually opened at startup.

#### 5. Injected PT_LOAD Segment

An attacker with write access to an ELF binary can insert an additional `PT_LOAD` entry in the program header table, `e_phnum`, and back the segment with encrypted shellcode at a high file offset. The kernel loads all `PT_LOAD` segments unconditionally.

Detection: `readelf -l sample | grep LOAD` — more than two `PT_LOAD` entries is unusual for most binaries. A `PT_LOAD` with `RWX` flags is unconditional justification for deeper analysis.

#### 6. Ghost Sections

Section headers can point to file offsets or virtual addresses that fall outside any `PT_LOAD` segment. The kernel ignores section headers at runtime, so ghost sections are invisible to the process but visible to static analysis tools — until the malware zeros `e_shoff` to hide the entire section table.

Detection: cross-reference every section's `sh_addr` against the ranges covered by `PT_LOAD` segments. Any section whose address is not covered by a loadable segment is a ghost. `readelf -S` vs `readelf -l` side by side.

#### 7. Debug Info Abuse

DWARF debug information in `.debug_info`, `.debug_str`, and related sections is parsed only by debuggers and DWARF-aware tools — not by AV scanners. Attackers have stored encrypted payloads here, relying on the section's presence in legitimate debug builds for cover.

Detection: `dwarfdump --all sample` dumps all DWARF data. Measure section entropy: `binwalk --entropy sample`. High entropy in `.debug_*` sections that are not otherwise consistent with debug builds is suspicious.

#### 8. RPATH / RUNPATH Manipulation

`DT_RPATH` and `DT_RUNPATH` entries in `.dynamic` specify library search paths that take precedence over system defaults. If they include relative paths (`.`, `./lib`) or attacker-controlled directories (`/tmp`, user home), any binary launched from that directory will load attacker libraries instead of system ones.

Detection: `readelf -d sample | grep -E 'RPATH|RUNPATH'` or `patchelf --print-rpath sample`. Any value other than standard system paths (`/usr/lib`, `/lib`) or empty should be investigated.

#### 9. `.init_array` / Constructor Abuse

Functions listed in `.init_array` are called by `__libc_start_main` before `main()`, in the same way PE TLS callbacks precede OEP. A malicious shared library can install itself permanently by planting a function in `.init_array` that forks, drops a rootkit, or patches `/etc/ld.so.preload`.

Detection: `readelf -d sample | grep INIT` shows the `DT_INIT` and `DT_INIT_ARRAY` addresses. `objdump -d -j .init_array sample` disassembles constructor pointers. In `gdb`, `catch load` breaks on each library constructor.

#### 10. UPX / Custom Packer

`upx --best` compresses the entire ELF into a single `PT_LOAD` stub that decompresses the original binary into memory and transfers control. The `PT_INTERP` is replaced by the UPX unpacker stub. The original section table is destroyed.

Detection: `file sample` reports "UPX compressed". `binwalk sample` detects the UPX magic and embedded ELF. `upx -d sample` decompresses if the magic is intact; custom packers that strip UPX headers require `binwalk -e` or dynamic analysis.

---

## Analysis Workflow Cheat-Sheet

| Step | PE (Windows) | ELF (Linux) |
|---|---|---|
| Identify format | `file sample.exe` | `file sample` |
| Full header overview | `diec sample.exe` | `readelf -h sample` |
| Section list | `pestudio` → Sections | `readelf -S sample` |
| Imports / dependencies | `pestudio` → Imports | `readelf -d sample` (DT_NEEDED) |
| Entropy per section | `peframe sample.exe` | `binwalk --entropy sample` |
| Strings | `strings -n 8 -e l sample.exe` | `strings -n 8 sample` |
| TLS / init hooks | `pescan -t sample.exe` | `readelf -d sample` (INIT_ARRAY) |
| Security features | `winchecksec sample.exe` | `checksec --file=sample` |
| Packing detection | `diec`, `exeinfope` | `binwalk -e sample` |
| Overlay / appended | `pefile` overlay offset | `binwalk -e sample` |
| Memory dump compare | `pe-sieve --pid <PID>` | `volatility3 linux.proc.maps` |
| YARA scan | `yara rules.yar sample.exe` | `yara rules.yar sample` |

---

## Quick YARA Rules

```yara
rule PE_TLS_Callback_NoASLR_NoNX
{
    meta:
        description = "PE with TLS callback and missing ASLR or NX — common packer/anti-debug pattern"
        author      = "benjitrapp"
        date        = "2026-06-23"

    condition:
        uint16(0) == 0x5A4D                          // MZ magic
        and uint32(uint32(0x3C)) == 0x00004550       // PE signature
        // TLS directory present (entry 9 has non-zero RVA)
        and uint32(uint32(0x3C) + 0x18 + 0x60 + 9 * 8) != 0
        // DllCharacteristics missing ASLR (0x0040) or NX (0x0100)
        and (
            (uint16(uint32(0x3C) + 0x18 + 0x5E) & 0x0040) == 0
            or (uint16(uint32(0x3C) + 0x18 + 0x5E) & 0x0100) == 0
        )
}
```

```yara
rule ELF_RWX_Stack
{
    meta:
        description = "ELF binary with executable stack (PT_GNU_STACK PF_X set)"
        author      = "benjitrapp"
        date        = "2026-06-23"

    strings:
        // PT_GNU_STACK type = 0x6474e551, PF_X in flags byte
        // Little-endian pattern: type bytes + flags with exec bit
        $gnu_stack_rwx = { 51 E5 74 64 07 00 00 00 }   // type=GNU_STACK, flags=RWX (32-bit PHdr)

    condition:
        uint32(0) == 0x464C457F   // \x7fELF magic
        and $gnu_stack_rwx
}
```

---

## Resources

- [Microsoft PE/COFF Specification](https://learn.microsoft.com/en-us/windows/win32/debug/pe-format) — authoritative reference for all PE structures
- [corkami PE101 / ELF101 posters](https://github.com/corkami/pics/tree/master/binary) — visual format maps, indispensable for quick reference
- [pefile](https://github.com/erocarrera/pefile) — Python library for parsing PE files programmatically
- [readelf / objdump](https://www.gnu.org/software/binutils/) — binutils suite, standard on every Linux system
- [capa](https://github.com/mandiant/capa) — Mandiant's capability detection tool, maps PE/ELF behaviors to ATT&CK
- [pe-sieve / hollows-hunter](https://github.com/hasherezade) — hasherezade's tools for in-memory PE anomaly detection
- [pestudio](https://www.winitor.com/) — Marc Ochsenmeier's static PE analysis workbench
- [checksec](https://github.com/slimm609/checksec.sh) — binary security feature checker for ELF and PE
- [binwalk](https://github.com/ReFirmLabs/binwalk) — firmware and binary entropy/structure scanner
