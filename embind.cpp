// quick_example.cpp
#include <emscripten/bind.h>
#include "libprimer3.h"

using namespace emscripten;

EMSCRIPTEN_BINDINGS(my_module) {
    function("create_seq_arg", &create_seq_arg);
}
