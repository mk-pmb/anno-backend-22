#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function run_server () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  local SELFPATH="$(readlink -m -- "$BASH_SOURCE"/..)"
  cd -- "$SELFPATH" || return $?

  local RUNNER='nodemjs'
  local ITEM=
  for ITEM in cfg.@"$HOSTNAME"{/*,.*,}.rc; do
    [ ! -f "$ITEM" ] || source -- "$ITEM" cfg:run || return $?
  done

  local LOG_DEST="logs.@$HOSTNAME"
  mkdir --parents -- "$LOG_DEST"
  LOG_DEST+="/$FUNCNAME.log"
  >"$LOG_DEST" || return 4$(echo "E: Cannot write to logfile: $LOG_DEST" >&2)
  exec &> >(tee -- "$LOG_DEST")

  if ! </dev/null "$RUNNER" -e 0; then
    if [ -n "$npm_lifecycle_event" ]; then
      echo "E: Running inside npm but cannot find $RUNNER." \
        "Is the package installed correctly?" >&2
    else
      echo "E: $RUNNER failed. Is it in PATH? Try 'npm start' instead." >&2
    fi
    return 8
  fi

  exec "$RUNNER" src/runServer.mjs || return $?
}





run_server "$@"; exit $?
