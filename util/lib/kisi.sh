#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function chapterize () {
  local FLAGS=,
  if [ "$1" == --cwd ]; then FLAGS+="$1,"; shift; fi

  local DESCR="$1"
  case "$DESCR" in
    dinst_* )
      DESCR="$1"
      DESCR="${DESCR//_/ }"
      DESCR="${DESCR#* }"
      DESCR="${DESCR^}"
      ;;
    '' ) shift;;
    * ) shift;;
  esac

  [ -n "$DESCR" ] || DESCR="$*"
  echo -n "==== $DESCR "
  [[ "$FLAGS" == ,--cwd, ]] && echo -n "@ $PWD "
  echo '===='
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
