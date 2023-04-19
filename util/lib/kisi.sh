#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function chapterize () {
  local DESCR="$1"
  case "$DESCR" in
    dinst_* )
      DESCR="$1"
      DESCR="${DESCR//_/ }"
      DESCR="${DESCR#* }"
      DESCR="${DESCR^}"
      ;;
    '' ) shift; DESCR="$*";;
    * ) shift;;
  esac
  echo "==== $DESCR ===="
  [ "$#" == 0 ] && return 0
  "$@"
  local RV=$?
  if [ "$RV" == 0 ]; then
    echo "---- done: $DESCR ----"
    echo
  else
    echo
    [ "$RV" == 0 ] || echo "E: Failed (rv=$RV) to $DESCR" >&2
  fi
  return "$RV"
}





[ "$1" == --lib ] && return 0; "$@"; exit $?
