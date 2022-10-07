#!/bin/sed -urf
# -*- coding: UTF-8, tab-width: 2 -*-

# This is a temporary workaround. In the future, hopefully,
# usnam-pmb will unclutter the error messages.

/^ +jse_info: \{\},$/d
/^ +cause: \[Function: [a-z_]+\]/d

/^ +\[Symbol\((original|mutated)CallSite\)\]: \[$/{
  : read_more_callsite
    N
    s~\n +(CallSite \{\},? ?)+$~~
  /\n/!b read_more_callsite
  /\[\n +\],?$/d
}
