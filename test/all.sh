#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function all_tests () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  local REPOPATH="$(readlink -m -- "$BASH_SOURCE"/../..)"
  cd -- "$REPOPATH" || return $?

  elp || return $?
  npm start testfx_exit_soon_sec=1

  echo '+OK all tests passed.'
}










all_tests "$@"; exit $?
