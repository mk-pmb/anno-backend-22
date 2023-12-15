#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function run_cli_main () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  local SELFFILE="$(readlink -m -- "$BASH_SOURCE")"
  local SELFPATH="$(dirname -- "$SELFFILE")"
  cd -- "$SELFPATH" || return $?

  local -A CFG=(
    [run_task]='run_server_show_log_on_failure'
    [lint]=
    [run_prog]='nodemjs'
    [log_dest]="logs.@$HOSTNAME/server.log"
    )
  tty --silent || CFG[run_task]='actually_run_server'
  export anno_cfgfiles_dir="$SELFPATH/cfg.@$HOSTNAME"

  log_progress "Reading config file(s) for host '$HOSTNAME'."
  local ITEM=
  for ITEM in cfg.@"$HOSTNAME"{/*,.*,}.rc; do
    [ ! -f "$ITEM" ] || source -- "$ITEM" cfg:run || return $?
  done

  "${CFG[run_task]}" "$@" || return $?
}


function log_progress () { printf '%(%F %T)T P: %s\n' -1 "$*"; }


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
  verify_sigterm_compat || return $?
  verify_run_prog || return $?

  local LINT="${CFG[lint]}"
  if [ -n "$LINT" ]; then
    [ "$LINT" == + ] && LINT='elp'
    log_progress "Running linter: $LINT"
    "$LINT" || return $?
  fi

  # In case we're process ID 1 (e.g. in docker), we must either forward
  # signals like SIGTERM, or hand over PID 1 to a program that can ensure
  # proper forwarding to the server.
  # The easiest solution is to always hand over our PID to the server
  # itself, independent of whether our PID is 1.
  log_progress "Gonna replace pid $$ with: ${CFG[run_prog]}"
  exec "${CFG[run_prog]}" src/runServer.mjs "$@" || return $?$(
    echo "E: server exec failed, rv=$?" >&2)
}


function tee_output_to_logfile () {
  local LOG="${CFG[log_dest]}"
  [ -n "$LOG" ] || return 0
  mkdir --parents -- "$(dirname -- "$LOG")"

  local OLD="$(dirname -- "$LOG")/"
  OLD="${OLD#./}prev.$(basename -- "$LOG")"
  [ ! -f "$LOG" ] || mv --verbose --no-target-directory \
    -- "$LOG" "$OLD" || return $?

  >"$LOG" || return 4$(echo "E: Cannot write to logfile: $LOG" >&2)
  exec &> >(tee_output_to_logfile__then_optimize) || return 71
}


function tee_output_to_logfile__then_optimize () {
  tee -- "$LOG" || return $?
  "$SELFPATH"/src/unclutter_server_logfile.sed -i -- "$LOG" || return $?
}


function verify_sigterm_compat () {
  local PID1_CMD="$(ps ho args 1)"
  if <<<"$PID1_CMD" grep -qPe "(^|/)(node|nodejs|npm)\b"; then
    echo "E: Process ID 1 seems to be npm." \
      "This usually causes signal handling problems, mostly with SIGTERM." \
      "If you're running this in a docker container, please use" \
      "'$SELFFILE' as the docker command." >&2
    return 80
  fi
}


function verify_run_prog () {
  local PROG="${CFG[run_prog]}"
  case "$PROG" in
    '!no_verify!'* ) CFG[run_prog]="${PROG#!*!}"; return 0;;
  esac

  log_progress "Verify run_prog: $PROG"
  { which "$PROG" && </dev/null "$PROG" -e 0; } &>/dev/null && return 0

  local MAYBE=(
    "$SELFPATH/node_modules/.bin/$PROG"
    "/usr/lib/node_modules/.bin/$PROG"
    "/usr/lib/node_modules/$PROG/bin/$PROG"
    )
  local ALTN=
  for ALTN in "${MAYBE[@]}" ''; do
    if [ -z "$ALTN" ]; then
      log_progress "Using npm to search for run_prog locally." \
        "This may take a few seconds."
      ALTN="$(npm run sh which nodemjs | grep -Pe '^/')"
    fi
    [ -x "$ALTN" ] || continue
    log_progress "Trying probable run_prog: $ALTN"
    </dev/null "$ALTN" -e 0 &>/dev/null || continue
    log_progress "Adjusting run_prog to: $ALTN"
    CFG[run_prog]="$ALTN"
    return 0
  done

  echo "E: Even npm cannot find $PROG." \
    "Is the package installed correctly?" >&2
  return 81
}





run_cli_main "$@"; exit $?
