#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function anno2pg_dockerized () {
  local BASEURL="$1"; shift
  local INPUT_FILE="$1"; shift

  case "$BASEURL" in
    http://* | \
    https://* | \
    : ) ;;
    * )
      echo 'E: The first CLI argument must be' \
        'the public base URL of your annotation server,' \
        'or ":" (a single colon) to guess it from the first annotation.' >&2
      return 3;;
  esac

  local SELFPATH="$(readlink -m -- "$BASH_SOURCE"/..)"
  # cd -- "$SELFPATH" || return $?
  [ -n "$INPUT_FILE" ] || return 4$(echo "E: No annotations file given!" >&2)
  [ "$INPUT_FILE" == - ] || exec <"$INPUT_FILE" || return $?
  export DK_TASK='run_script'
  export DK_EVAL='src/hnd/anno/postNewAnno/anno2pg_cli.mjs'
  export DK_ENV_BASEURL="$BASEURL"
  "$SELFPATH"/install_dockerized.sh || return $?
}


anno2pg_dockerized "$@"; exit $?
