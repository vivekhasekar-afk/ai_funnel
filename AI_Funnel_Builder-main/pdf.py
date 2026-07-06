#!/usr/bin/env python3
"""
Sentivest Budget Summary - Markdown to PDF Converter (markdown-pdf version)

Requirements:
    pip install markdown-pdf
"""

import os
from pathlib import Path

from markdown_pdf import MarkdownPdf, Section


def markdown_to_pdf(markdown_file: str, output_pdf: str | None = None) -> bool:
    if output_pdf is None:
        output_pdf = Path(markdown_file).stem + ".pdf"

    try:
        # Read markdown content
        with open(markdown_file, "r", encoding="utf-8") as f:
            markdown_content = f.read()

        # Create PDF object
        pdf = MarkdownPdf(toc_level=2)  # TOC from headings up to level 2

        # Optional: set PDF metadata
        pdf.meta["title"] = "Sentivest Revised Budget Summary"
        pdf.meta["author"] = "Sentivest Founder"

        # Add the whole markdown as a single section
        pdf.add_section(Section(markdown_content, toc=False))

        # Save PDF
        pdf.save(output_pdf)

        print(f"✅ PDF created successfully: {output_pdf}")
        print(f"📄 File size: {os.path.getsize(output_pdf) / 1024:.2f} KB")
        return True

    except FileNotFoundError:
        print(f"❌ Error: Markdown file '{markdown_file}' not found")
        return False
    except Exception as e:
        print(f"❌ Error during conversion: {e}")
        return False


def main():
    print("=" * 60)
    print("Sentivest Budget Summary - Markdown to PDF Converter")
    print("=" * 60)

    markdown_file = "Sentivest-Budget-Summary.md"

    if not os.path.exists(markdown_file):
        print(f"\n❌ File not found: {markdown_file}")
        return

    output_pdf = "Sentivest-Budget-Summary.pdf"

    print(f"\n📖 Reading: {markdown_file}")
    print("📥 Converting to PDF...")

    success = markdown_to_pdf(markdown_file, output_pdf)

    if success:
        print("\n✨ Conversion complete!")
        print(f"📍 Output: {os.path.abspath(output_pdf)}")
    else:
        print("\n⚠️  Conversion failed.")


if __name__ == "__main__":
    main()
