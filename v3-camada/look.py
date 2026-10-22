#!/usr/bin/env python3
"""Roda o look.py da motionmaxxing (clonada em ./v3) sem alterar o código dela.
Alguns ffmpeg (o do Homebrew, por exemplo) vêm sem o filtro drawtext, que marca a hora em cada quadro
da folha; sem ele, a folha sai sem a hora (os números dos gates não mudam)."""
import os, subprocess, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "v3", "scripts"))
import look  # noqa: E402

filtros = subprocess.run(["ffmpeg", "-hide_banner", "-filters"], capture_output=True, text=True).stdout
if " drawtext " not in filtros:
    look.FONTS = []
sys.argv[0] = look.__file__
look.main()
