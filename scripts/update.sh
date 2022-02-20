#!/bin/bash
# This is merely an example file. Overengineered for what it is
APT=/usr/bin/apt
PACMAN=/bin/pacman
DNF=/usr/bin/dnf
PKG=/usr/local/sbin/
if [ -f "$APT" ];
then
    echo updating debian/ubuntu.
    apt update
    apt upgrade
elif [ -f "$PACMAN" ];
then
    echo updating arch.
    pacman -Suy
elif [ -f "$DNF" ];
then
    echo updating Fedora/CentOS/RedHat.
    dnf update
    dnf upgrade
elif [ -f "$PKG" ];
then
    echo updating Freebsd?
    pkg update
    pkg upgrade
else 
    echo Unsupported system detected.
fi

