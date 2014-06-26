# ======================================================================
# (c) Copyright 1996,1997,1998,1999,2000,2001,2004,2006,2007,2008,2009
# Whitehead Institute for Biomedical Research, Steve Rozen, 
# Andreas Untergasser and Helen Skaletsky
# All rights reserved.
# 
#   This file is part of primer3, the libprimer3 library, the oligotm 
#   library and the dpal library.
#
#   Primer3 and the libraries above are free software; you can
#   redistribute them and/or modify them under the terms of the GNU
#   General Public License as published by the Free Software Foundation;
#   either version 2 of the License, or (at your option) any later
#   version.
#
#   This software is distributed in the hope that it will be useful,
#   but WITHOUT ANY WARRANTY; without even the implied warranty of
#   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#   GNU General Public License for more details.
#
#   You should have received a copy of the GNU General Public License
#   along with this file (file gpl-2.0.txt in the source distribution); if
#   not, write to the Free Software Foundation, Inc., 51 Franklin St,
#   Fifth Floor, Boston, MA 02110-1301 USA
# 
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
# "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
# LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
# A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
# OWNERS OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
# SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
# LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
# DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
# THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
# (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
# OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
# ======================================================================

# ======================================================================
# CITING PRIMER3
# 
# Steve Rozen and Helen J. Skaletsky (2000) Primer3 on the WWW for
# general users and for biologist programmers. In: Krawetz S, Misener S
# (eds) Bioinformatics Methods and Protocols: Methods in Molecular
# Biology. Humana Press, Totowa, NJ, pp 365-386.  Source code available
# from https://sourceforge.net/projects/primer3/
# ======================================================================

# For VALGRIND -- see end of this makefile for testing primer3_core
# with valgrind, a leak and memory access checker.
TESTOPTS= 
WINMAKE=mingw32-make

LDLIBS     = -lm
AR         = ar
CC         = gcc
CPP        = g++
O_OPTS     = -O2
CC_OPTS    = -g -Wall -D__USE_FIXED_PROTOTYPES__
P_DEFINES  =

CFLAGS  = $(CC_OPTS) $(O_OPTS)
LDFLAGS = -g
# Note, for profiling, use
# make O_OPTS='-pg -O0' LDFLAGS='-g -pg'

# ======================================================================
# If you have trouble with library skew when moving primer3 executables
# between systems, you might want to set LIBOPTS to -static
LIBOPTS =

ifeq ($(TESTOPTS),--windows)
	PRIMER_EXE      = primer3_core.exe
	NTDPAL_EXE      = ntdpal.exe
	NTTHAL_EXE      = ntthal.exe
	OLIGOTM_EXE     = oligotm.exe
	LONG_SEQ_EXE	= long_seq_tm_test.exe
else
	PRIMER_EXE      = primer3_core
	NTDPAL_EXE      = ntdpal
	NTTHAL_EXE      = ntthal
	OLIGOTM_EXE     = oligotm
	LONG_SEQ_EXE	= long_seq_tm_test
endif
LIBOLIGOTM      = liboligotm.a
LIBOLIGOTM_DYN  = liboligotm.so.1.2.0
LIBDPAL         = libdpal.a
LIBDPAL_DYN     = libdpal.a.so.1.0.0
LIBTHAL         = libthal.a
LIBTHAL_DYN     = libthal.a.so.1.0.0
LIBPRIMER3      = libprimer3.a
LIBPRIMER3_DYN  = libprimer3.so.1.0.0
LIBRARIES       = $(LIBPRIMER3) $(LIBDPAL) $(LIBTHAL) $(LIBOLIGOTM) 
DYNLIBS         = $(LIBPRIMER3_DYN) $(LIBDPAL_DYN) $(LIBTHAL_DYN) $(LIBOLIGOTM_DYN)
RANLIB          = ranlib

PRIMER_OBJECTS1=primer3_boulder_main.o\
                format_output.o\
                read_boulder.o\
                print_boulder.o 

PRIMER_OBJECTS=$(PRIMER_OBJECTS1) $(LIBRARIES)
PRIMER_DYN_OBJECTS=$(PRIMER_OBJECTS1) $(DYNLIBS)
# These are files generated by running ./primer3_core < ../example
example_files=example.for example.rev example.int

EXES=$(PRIMER_EXE) $(NTDPAL_EXE) $(NTTHAL_EXE) $(OLIGOTM_EXE) $(LONG_SEQ_EXE)

all: $(EXES) $(LIBRARIES)

clean_src:
ifeq ($(TESTOPTS),--windows)
	del /Q /F *.o $(EXES) *~ $(LIBRARIES) $(example_files) core ..\*~
else
	-rm -f *.o $(EXES) *~ $(LIBRARIES) $(DYNLIBS) $(example_files) core ../*~
endif

clean: clean_src
ifeq ($(TESTOPTS),--windows)
	cd ..\test & $(WINMAKE) clean TESTOPTS=$(TESTOPTS)
else
	cd ../test/; make clean
endif

$(LIBOLIGOTM): oligotm.o
	$(AR) rv $@ oligotm.o
	$(RANLIB) $@

$(LIBOLIGOTM_LIB): oligotm.o
	$(CC) -shared -W1,-soname,liboligotm.so.1 -o $(LIBOLIGOTM_DYN) oligotm.o

$(LIBDPAL): dpal_primer.o
	$(AR) rv $@ dpal_primer.o
	$(RANLIB) $@

$(LIBDPAL_DYN): dpal_primer.o
	$(CC) -shared -W1,-soname,libdpal.so.1 -o $(LIBDPAL_DYN_LIB) dpal_primer.o

$(LIBTHAL): thal_primer.o
	$(AR) rv $@ thal_primer.o
	$(RANLIB) $@

$(LIBTHAL_DYN): thal_primer.o
	$(CC) -shared -W1,-soname,libthal.so.1 -o $(LIBTHAL_DYN_LIB) thal_primer.o

$(LIBPRIMER3): libprimer3.o p3_seq_lib.o
	$(AR) rv $@ libprimer3.o p3_seq_lib.o
	$(RANLIB) $@

$(LIBPRIMER3_DYN): libprimer3.o p3_seq_lib.o
	$(CC) -shared -W1,-soname,liprimer3.so.1 -o $(LIBPRIMER3_DYN) libprimer3.o p3_seq_lib.o

$(PRIMER_EXE): $(PRIMER_OBJECTS)
	$(CPP) $(LDFLAGS) -o $@ $(PRIMER_OBJECTS) $(LIBOPTS) $(LDLIBS)

libprimer3.o: libprimer3.c libprimer3.h p3_seq_lib.h dpal.h thal.h oligotm.h
	$(CPP) -c $(CFLAGS) -Wno-deprecated $(P_DEFINES) -o $@ libprimer3.c

$(NTDPAL_EXE): ntdpal_main.o dpal.o
	$(CPP) $(LDFLAGS) -o $@ ntdpal_main.o dpal.o

$(NTTHAL_EXE): thal_main.o thal.o
	$(CPP) $(LDFLAGS) -o $@ thal_main.o thal.o $(LDLIBS)

$(OLIGOTM_EXE): oligotm_main.c oligotm.h $(LIBOLIGOTM)
	$(CPP) $(CFLAGS) -o $@ oligotm_main.c $(LIBOLIGOTM) $(LIBOPTS) $(LDLIBS)

$(LONG_SEQ_EXE): long_seq_tm_test_main.c oligotm.o
	$(CPP) $(CFLAGS) -o $@ long_seq_tm_test_main.c oligotm.o $(LIBOPTS) $(LDLIBS)

read_boulder.o: read_boulder.c read_boulder.h libprimer3.h dpal.h thal.h p3_seq_lib.h 
	$(CPP) -c $(CFLAGS) $(P_DEFINES) -o $@ read_boulder.c

print_boulder.o: print_boulder.c print_boulder.h libprimer3.h p3_seq_lib.h 
	$(CPP) -c $(CFLAGS) $(P_DEFINES) -o $@ print_boulder.c

dpal.o: dpal.c dpal.h
	$(CPP) -c $(CFLAGS) -o $@ dpal.c

# We use '-ffloat-store' on windows to prevent undesirable
# precision which may lead to differences in floating point results.
thal.o: thal.c thal.h
	$(CPP) -c $(CFLAGS) -ffloat-store -o $@ thal.c

p3_seq_lib.o: p3_seq_lib.c p3_seq_lib.h libprimer3.h
	$(CPP) -c $(CFLAGS) -o $@ p3_seq_lib.c

dpal_primer.o: dpal.c dpal.h
	$(CPP) -c $(CFLAGS) $(P_DEFINES) -o $@ dpal.c

thal_primer.o: thal.c thal.h
	$(CPP) -c $(CFLAGS) -ffloat-store $(P_DEFINES) -o $@ thal.c

format_output.o: format_output.c format_output.h libprimer3.h dpal.h thal.h p3_seq_lib.h 
	$(CPP) -c $(CFLAGS) $(P_DEFINES) -o $@ format_output.c

ntdpal_main.o: ntdpal_main.c dpal.h
	$(CPP) -c $(CC_OPTS) -o $@ ntdpal_main.c

thal_main.o: thal_main.c thal.h
	$(CPP) -c $(CFLAGS) -o $@ thal_main.c
# We use CC_OPTS above rather than CFLAGS because
# gcc 2.7.2 crashes while compiling ntdpal_main.c with -O2

oligotm.o: oligotm.c oligotm.h

primer3_boulder_main.o: primer3_boulder_main.c libprimer3.h dpal.h thal.h oligotm.h format_output.h print_boulder.h read_boulder.h
	$(CPP) -c $(CFLAGS) $(P_DEFINES) primer3_boulder_main.c

primer_test: test

test: $(PRIMER_EXE) $(NTDPAL_EXE) $(NTTHAL_EXE)
ifeq ($(TESTOPTS),--windows)
	cd ..\test & $(WINMAKE) TESTOPTS=$(TESTOPTS)
else
	cd ../test; make test
endif

# ======================================================================
# 
# VALGRIND INSTRUCTIONS.
# 
# These instructions work for linux, and run the 'memcheck'
# functionality of valgrind.  Tests will be _much_ slower
# when running with valgrind checks.
# 
# If necessary, get and install valgrind (should come with most
# Linux's, but you need valgrind >= 3.2.3)
# 
# In the src directory for primer3:
#  
# $ make clean
# 
# Re-complile without optimization and run the normal tests, does
# _not_ valgrind them:
#
# $ make O_OPTS=-O0 test  # The value of O_OPTS is Minus Oh Zero 
# 
# Run valgrind on a small example:
#
# $ valgrind --leak-check=yes --show-reachable=yes --log-file-exactly=p3vg ./primer3_core < ../example
#
# Check output in file p3vg 
#
# Note: Valgrind is at /usr/local/bin/valgrind at WI
# 
# OK, now for the real tests:
#
# $ cd ../test
# 
# Check valgrind path in p3test.pl, ntdpal_test.pl, and oligotm_test.pl
# and correct if necessary.  This code works under valgrind 3.2.3.
# 
# $ make TESTOPTS=--valgrind  # Remember, you have to be in test/
# 
# When the --valgrind flag is set, the perl test scripts grep for and
# display errors and leaks, but you need to ***look at the output** to
# see these and figure out which test caused the problem, so you can
# debug it.
#
# ======================================================================