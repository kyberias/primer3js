all: libprimer3.js

libprimer3.js: libprimer3.o p3_seq_lib.o
	em++ -O2 libprimer3.o p3_seq_lib.o -o libprimer3.js -s EXPORTED_FUNCTIONS=['_choose_primers','_create_seq_arg','_p3_create_global_settings','_p3_set_sa_sequence','_p3_set_sa_left_input','_p3_set_sa_right_input','_p3_get_rv_best_pairs','_libprimer3_release','_p3_get_rv_fwd','_p3_get_rv_per_sequence_errors']

libprimer3.o: libprimer3.c libprimer3.h p3_seq_lib.h dpal.h thal.h oligotm.h
	em++ -O2 libprimer3.c -c -o libprimer3.o

p3_seq_lib.o: p3_seq_lib.c p3_seq_lib.h libprimer3.h
	em++ -O2 p3_seq_lib.c -c -o p3_seq_lib.o

#not supported in Emscripten fastcomp
#embind.o: embind.cpp
#	em++ --bind -o p3_seq_lib.o embind.cpp
