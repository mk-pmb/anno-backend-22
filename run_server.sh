#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function run_cli_main () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  local SELFPATH="$(readlink -m -- "$BASH_SOURCE"/..)"
  cd -- "$SELFPATH" || return $?

  local -A CFG=(
    [run_task]='run_server_show_log_on_failure'
    [lint]=
    [run_prog]='nodemjs'
    [log_dest]="logs.@$HOSTNAME/$FUNCNAME.log"
    )
  tty --silent || CFG[run_task]='actually_run_server'

  local ITEM=
  for ITEM in cfg.@"$HOSTNAME"{/*,.*,}.rc; do
    [ ! -f "$ITEM" ] || source -- "$ITEM" cfg:run || return $?
  done

  "${CFG[run_task]}" "$@" || return $?
}


function run_server_show_log_on_failure () {
  ( # These parens force a subprocess with separate stdout and stderr,
    # so their redirection to `log_dest` won't interfere with our `less`.
    actually_run_server "$@"
  )
  local RV="$?"
  [ "$RV" == 0 ] || less -S +G -- "${CFG[log_dest]}" || return $?
  return "$RV"
}


function actually_run_server () {
  tee_output_to_logfile || return $?
  verify_run_prog || return $?

  local LINT="${CFG[lint]}"
  [ "$LINT" == + ] && LINT='elp'
  [ -z "$LINT" ] || "$LINT" || return $?

  "${CFG[run_prog]}" src/runServer.mjs "$@"
  local RV="$?"
  echo "D: Server quit, rv=$RV"
  return "$RV"
}


function tee_output_to_logfile () {
  mkdir --parents -- "$(dirname -- "${CFG[log_dest]}")"
  >"${CFG[log_dest]}" || return 4$(
    echo "E: Cannot write to logfile: ${CFG[log_dest]}" >&2)
  exec &> >(tee -- "${CFG[log_dest]}") || return $?
}


function verify_run_prog () {
  </dev/null "${CFG[run_prog]}" -e 0 && return 0

  if [ -n "$npm_lifecycle_event" ]; then
    echo "E: Running inside npm but cannot find ${CFG[run_prog]}." \
      "Is the package installed correctly?" >&2
  else
    echo "E: ${CFG[run_prog]} failed. Is it in PATH? Try 'npm start' instead." >&2
  fi
  return 8
}





run_cli_main "$@"; exit $?
