#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function make_random_passwords () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  local SELFPATH="$(readlink -m -- "$BASH_SOURCE"/..)"
  cd -- "$SELFPATH" || return $?

  local ERR_CNT=0 SKIP_CNT=0 NEW_CNT=0 DEST=
  for DEST in $(grep -xPe '/\S+\.pswd.txt' -- .gitignore); do
    DEST="${DEST#/}"
    make_one_random_password "$DEST" || (( ERR_CNT += 1 ))
  done

  [ "$ERR_CNT" == 0 ] || return 4$(echo "E: $ERR_CNT failures!" >&2)
  echo "Created $NEW_CNT password files, skipped $SKIP_CNT."
}


function make_one_random_password () {
  echo -n "$DEST: "
  if [ -f "$DEST" ]; then
    echo 'exists, skip.'
    (( SKIP_CNT += 1 ))
    return 0
  fi
  >>"$DEST" || return $?$(echo "E: Failed to create $DEST" >&2)
  chmod a=,u=rw -- "$DEST" || return $?$(echo "E: Failed to chmod $DEST" >&2)
  head --bytes=30 -- /dev/urandom | base64 --wrap=0 | tr -d '\n' \
    >"$DEST" || return $?$(echo "E: Failed to write $DEST" >&2)
  echo 'created.'
  (( NEW_CNT += 1 ))
}










make_random_passwords "$@"; exit $?
