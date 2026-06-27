---
layout: memory
title: Ghidra Cheat Sheet
---

<img height="160" align="left" src="/images/ghidra_logo.png">
Ghidra is the free and open source software reverse engineering suite built by the NSA. It ships with a powerful disassembler, a decompiler that turns machine code back into readable pseudo C, a scripting engine, and a rich set of analysis tools. This cheat sheet collects the default key bindings and the everyday workflow that make reversing in Ghidra fast.

Two sources serve as context for this sheet:

- [Ghidra Cheat Sheet (PDF)](https://www.ita.wat.edu.pl/~aep/PNAK/TOOLS/Ghidra/GhidraCheatSheet.pdf)
- [Mastering Ghidra: essential hotkeys](https://medium.com/re-exploit/mastering-ghidra-essential-hotkeys-for-efficient-reverse-engineering-cddabf31b557)

All key bindings below are the defaults. You can remap any of them with the Set Key Binding action (F4) while hovering over a menu item.

## Summary

- [Summary](#summary)
- [Reverse Engineering Workflow](#reverse-engineering-workflow)
- [The CodeBrowser Windows](#the-codebrowser-windows)
- [Navigation](#navigation)
- [Code and Data Operations](#code-and-data-operations)
- [Defining Data](#defining-data)
- [Labels, Comments and Functions](#labels-comments-and-functions)
- [Decompiler Actions](#decompiler-actions)
- [Decompiler Clean Up Loop](#decompiler-clean-up-loop)
- [Search](#search)
- [Bookmarks and Editing](#bookmarks-and-editing)
- [Pro Tips](#pro-tips)

## Reverse Engineering Workflow

A typical session moves from importing the target to a clean, well annotated Listing and Decompiler view. The loop in the middle is where most of the time goes: read, rename, comment, repeat.

<pre class="mermaid">
flowchart TD
    A[Create project] --> B[Import binary]
    B --> C[Run auto analysis]
    C --> D[Inspect Symbol Tree and entry point]
    D --> E[Read the Listing]
    E --> F[Open the Decompiler]
    F --> G[Rename labels and variables]
    G --> H[Add comments and bookmarks]
    H --> I{More to understand}
    I -- Yes --> E
    I -- No --> J[Export notes and findings]
</pre>

## The CodeBrowser Windows

The CodeBrowser is the main tool. These are the panes you reach for most. Use the Window menu to reopen any that you closed by accident.

<pre class="mermaid">
flowchart LR
    CB[CodeBrowser] --> PT[Program Trees]
    CB --> ST[Symbol Tree]
    CB --> DTM[Data Type Manager]
    CB --> LS[Listing]
    CB --> DC[Decompiler]
    CB --> CG[Function Call Graph]
    CB --> BM[Bookmarks]
    CB --> DBG[Defined Strings]
</pre>

## Navigation

| Key | Action |
| --- | --- |
| G | Go to an address, label or expression |
| Alt + Left Arrow | Navigate back to the previous location |
| Alt + Right Arrow | Navigate forward |
| Enter | Follow the reference under the cursor |
| Ctrl + F6 | Jump to the last active program or component |
| F5 | Refresh the view |

## Code and Data Operations

| Key | Action |
| --- | --- |
| D | Disassemble the bytes at the cursor |
| C | Clear code or data back to raw bytes |
| T | Define data by choosing a type |
| Y | Repeat the last define data action |
| P | Create a pointer |
| [ | Create an array |
| Shift + [ | Create a structure |
| Delete | Remove a label or a function |

## Defining Data

When the cursor sits on undefined bytes you decide what they are. This is the fastest way to give a binary structure and meaning.

<pre class="mermaid">
flowchart TD
    S[Cursor on undefined bytes] --> Q{What kind of data}
    Q -- Code --> D[Press D to disassemble]
    Q -- Single value --> T[Press T to choose a type]
    Q -- Pointer --> P[Press P to create a pointer]
    Q -- Repeated values --> A[Press the open bracket to make an array]
    Q -- Wrong guess --> C[Press C to clear, then retry]
</pre>

## Labels, Comments and Functions

| Key | Action |
| --- | --- |
| L | Edit a label, rename a function or rename a variable |
| ; | Open the Set Comment dialog (EOL, pre, post or plate) |
| F | Create a function at the cursor |
| Ctrl + Shift + F | Show references to the item under the cursor |
| Ctrl + L | Retype the variable under the cursor |

## Decompiler Actions

The Decompiler is where readability is won. Rename and retype aggressively until the pseudo C reads like real source.

| Key | Action |
| --- | --- |
| Ctrl + E | Toggle the Decompiler panel |
| L | Rename the variable under the cursor |
| Ctrl + L | Retype the variable under the cursor |
| ; | Add a comment that follows you into the Listing |
| Middle Click | Highlight every use of a variable |

## Decompiler Clean Up Loop

<pre class="mermaid">
flowchart TD
    R[Read the messy output] --> N[Rename variables with L]
    N --> RT[Retype variables with Ctrl + L]
    RT --> FS[Fix the function signature]
    FS --> CM[Comment the tricky logic]
    CM --> CL{Is it readable now}
    CL -- No --> N
    CL -- Yes --> SV[Save and move on]
</pre>

## Search

| Key | Action |
| --- | --- |
| S | Search memory for bytes or a value |
| F3 | Repeat the last memory search |
| Ctrl + Shift + E | Search program text across the binary |
| Ctrl + Shift + F3 | Repeat the last text search |

## Bookmarks and Editing

| Key | Action |
| --- | --- |
| Ctrl + B | Add a bookmark at the cursor |
| Ctrl + Shift + G | Assemble or patch an instruction |
| Ctrl + Alt + I | Extract and import an embedded file |
| Ctrl + A | Select all rows in a table |
| Ctrl + C, Ctrl + V, Ctrl + X | Copy, paste, cut |
| Ctrl + Z | Undo |
| Ctrl + Shift + Z | Redo |
| F1 | Open the help contents |
| F4 | Set or change a key binding |

## Pro Tips

- Let auto analysis finish before you dig in. The cross references and function boundaries it builds are the backbone of every later step.
- Rename as you read. A variable called local18 means nothing, but bufferLen tells the whole story three lines later.
- Drop a bookmark on every interesting spot. The Bookmarks window then becomes your personal map of the binary.
- Build structures early. Once you define a struct in the Data Type Manager, every pointer that uses it becomes readable in one move.
- The semicolon comment you add in the Decompiler also shows up in the Listing, so you only annotate once.
- When a key binding feels wrong for your layout, hover the menu entry and press F4 to rebind it to whatever fits your hands.
