#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-
#
# dkpgu = "docker postgres utility"

function dkpgu_main () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  local SELFFILE="$(readlink -f -- "$BASH_SOURCE")"
  local SELFPATH="$(dirname -- "$SELFFILE")"
  local INVOKED_AS="$0"
  cd -- "$SELFPATH" || return $?

  local TASK=
  dkpgu_maybe_set_task_from_invocation || return $?
  if [ -z "$TASK" ]; then TASK="$1"; shift; fi

  "${FUNCNAME%_*}_$TASK" "$@" || return $?$(
    echo "E: Task '$TASK' failed with error code $?" >&2)
}


function dkpgu_maybe_set_task_from_invocation () {
  local INV="$INVOKED_AS"
  case "$INV" in
    "$SELFPATH"/*/* ) return 0;;
    "$SELFPATH"/* ) INV="${INV:${#SELFPATH}}"; INV="${INV#/}";;
    * ) return 0;;
  esac
  case "$INV" in
    '' ) return 0;;
    *[^a-z_]* ) return 0;;
  esac

  if [ -L "$INV" -a "$INV" -ef "$SELFFILE" ]; then
    # ^-- i.e., a symlink that points to this file.
    case "$INV" in
      c ) TASK='cmd';;
      f ) TASK='file';;
      * ) TASK="$INV";;
    esac
    return 0
  fi
}


function dkpgu_psql_dfopt () {
  local PROG="$1"; shift
  local OPT=(
    --user=postgres
    --no-password
    --dbname=postgres
    )
  "$PROG" "${OPT[@]}" "$@"
}


function dkpgu_export () {
  local DUMP_OPT=(
    --quote-all-identifiers
    --strict-names
    --data-only
    )
  dkpgu_psql_dfopt pg_dump "${DUMP_OPT[@]}" "$@";
}


function dkpgu_cmd () { dkpgu_psql --command="$1"; }
function dkpgu_pg_dump () { dkpgu_psql_dfopt pg_dump "$@"; }
function dkpgu_psql () { dkpgu_psql_dfopt psql "$@"; }
function dkpgu_psql () { dkpgu_psql_dfopt psql "$@"; }


function dkpgu_is_gzip_file () {
  # Checking the magic number bytes in the header is good enough for us.
  head -c 2 -- "$1" | LANG=C grep -qxFe $'\x1F\x8B'
}


function dkpgu_file () {
  if dkpgu_is_gzip_file "$1"; then
    exec < <(gzip -dc -- "$1")
    set -- /dev/stdin
  fi
  dkpgu_psql --file="$1"
}









dkpgu_main "$@"; exit $?
