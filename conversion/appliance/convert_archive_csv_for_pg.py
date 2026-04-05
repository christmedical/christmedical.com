#!/usr/bin/env python3
"""
Convert archive CSV files (UTF-8, field delimiter U+00A6 BROKEN BAR ¦) into
PostgreSQL-friendly UTF-8 CSV with TAB delimiter (single byte).

Usage:
  convert_archive_csv_for_pg.py <source_dir> <dest_dir>

Expects: patients.csv, visits.csv, vitals_core.csv, lab_results.csv in source_dir.
"""
from __future__ import annotations

import csv
import os
import sys

BROKEN_BAR = "\u00a6"
FILES = ("patients.csv", "visits.csv", "vitals_core.csv", "lab_results.csv")


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: convert_archive_csv_for_pg.py <source_dir> <dest_dir>", file=sys.stderr)
        return 2

    src = sys.argv[1]
    dst = sys.argv[2]
    os.makedirs(dst, exist_ok=True)

    for name in FILES:
        inf = os.path.join(src, name)
        if not os.path.isfile(inf):
            print(f"skip missing: {inf}", file=sys.stderr)
            continue
        outf = os.path.join(dst, name)
        with open(inf, newline="", encoding="utf-8") as f_in:
            reader = csv.reader(f_in, delimiter=BROKEN_BAR)
            with open(outf, "w", newline="", encoding="utf-8") as f_out:
                writer = csv.writer(f_out, delimiter="\t", quoting=csv.QUOTE_MINIMAL)
                for row in reader:
                    writer.writerow(row)

    return 0


if __name__ == "__main__":
    sys.exit(main())
