#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function daily_anno_dumper () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  local DUMPS_DIR="${ANNO_DUMPS_DIR:-/pgdumps/new_annos}"
  mkdir --parents -- "$DUMPS_DIR" || true
  cd -- "$DUMPS_DIR" || return $?$(
    echo E: 'Failed to chdir to dumps directory!' >&2)

  local LATEST_DIR=
  dad_latest_dir_scan_double_digit_subdir || return $? # year
  dad_latest_dir_scan_double_digit_subdir || return $? # month
  # dad_latest_dir_scan_double_digit_subdir || return $? # day
  # echo "Potentially latest date subdirectory: $LATEST_DIR"

  local ANNOS_AFTER="$ANNO_DUMPS_SINCE"
  [ -n "$ANNOS_AFTER" ] || ANNOS_AFTER="$(
    head -n 1 -- "$LATEST_DIR"/[0-9]*.js 2>/dev/null |
      sed -nre 's!^//=dumpStartDate=!!p' | LANG=C sort -g | tail -n 1)"
  ANNOS_AFTER="${ANNOS_AFTER:-2000-01-01T00:00:00Z}"
  local TIMESPAN_MARGIN="${ANNO_DUMPS_MARGIN:-10 min}"

  local DUMP_SORT_CMD='sort -sV'
  # ^-- We have to use version sort b/c busybox's general numeric sort
  #     doesn't consider our date comment in line 1 to go before data lines.

  local TASK="${1:-default_task}"; shift
  dad_"$TASK" "$@" || return $?$(
    echo E: $FUNCNAME: "Task '$TASK' failed, rv=$?" >&2)
}


function dad_default_task () {
  local SAVE_TS=
  printf -v SAVE_TS '%(%Z)T' -2
  [ "$SAVE_TS" == UTC ] || return 4$(
    echo E: "Expected to run in timezone UTC, not '$SAVE_TS'" >&2)
  printf -v SAVE_TS -- '%(%y/%m/%y%m%d.%H%M%S)T' -2
  local TMPF="tmp.dumper.${SAVE_TS##*/}.$$.js"
  printf '//=dumpStartDate=%(%FT%TZ)T\n' >"$TMPF" || return 4$(
    echo E: $FUNCNAME: "Failed to write the dump start date!" >&2)

  dad_fix_owner || return $?
  # ^-- If the next steps fail, it should be easy to delete $TMPF.

  dad_run_all_queries >>"$TMPF" || return 4$(
    echo E: $FUNCNAME: "Failed to dump the data, rv=$?" >&2)

  if grep -m 1 -qoe '^[a-z]' -- "$TMPF"; then
    LANG=C $DUMP_SORT_CMD -c -- "$TMPF" || return 4$(
      echo E: "The dump seems to not be sorted correctly: $TMPF" >&2)
    mkdir --parents -- "${SAVE_TS%/*}" || true
    mv -vT -- "$TMPF" "$SAVE_TS.js" || return $?
    dad_fix_owner || return $?
  else
    echo D: "Found no new data since ('$ANNOS_AFTER' - '$TIMESPAN_MARGIN')."
    rm -- "$TMPF"
  fi
}


function dad_fix_owner () {
  # BusyBox chown doesn't support `--reference .`, so we `stat` instead:
  chown "$(stat -c %u:%g .)" -R . || true
}


function dad_run_one_query () {
  local QRY_NAME="$1"
  local SQL_CMD="$(dad_gen_one_query "$QRY_NAME")"
  local PSQL_OPT=(
    --no-align
    --echo-errors
    --quiet
    --field-separator='('
    # \n is default anyways # --record-separator=$'\n'
    --tuples-only
    --expanded
    --user=postgres
    --no-password
    --dbname=postgres
    )
  psql "${PSQL_OPT[@]}" --command="$SQL_CMD" | sed -rf <(echo '
    : gather_multiline_json
    /;$/!{
      N
      b gather_multiline_json
    }
    s~^\s*~~
    s~\n\s*~ ~g

    # Normalize first timestamp to 3 digits b/c json_build_array in postgres
    # v17 ignores the timestamp column precision:
    s~^([^T ]+T[0-9:]{8})\.?([0-9]*)(["+-][^" ]+", ")~\1.\n\20000\n\3~
    s~\n\+00:00~\nZ~
    s~\n([0-9]{3})0*\n~\1~
    '

    # We want our file sorted in a way that we can easily verify to be sorted
    # correctly, to have one more indicator for data rot.
    # Unfortunately, the postgres sorting for equal time_created and equal
    # base_id differs from busybox's "sort" in ways yet to be understood,
    # both for version sort and general numeric sort. Since we have a lot of
    # same-millisecond clusters (see goodies/time_created_clusters.sql),
    # it's infeasible to just tweak them a little here and there.
    # It seems we do need to invest the memory to sort in the shell:
    ) | LANG=C $DUMP_SORT_CMD
  local RV="${PIPESTATUS[*]}"
  [ "$RV" == '0 0 0' ] || return 4$(
    echo E: $FUNCNAME: "Failed to dump query '$QRY_NAME', rv=[$RV]" >&2)
}


function dad_run_all_queries () {
  dad_run_one_query anno || return $?
  dad_run_one_query retracted || return $?
  dad_run_one_query stamp || return $?
}


function dad_gen_one_query () {
  local QRY_NAME="$1"
  local SQL="
    SELECT json_build_array(<date_col>,
      base_id || '~' || version_num<extra_cols>
    ) || ');' AS \"$QRY_NAME\" FROM <from>
    WHERE <date_col> > '$ANNOS_AFTER'::timestamptz$(
      ) - INTERVAL '$TIMESPAN_MARGIN'<extra_where>
    "
    # Sorting here wouldn't be verifiable, see above.
    # -- ORDER BY <date_col> ASC, base_id ASC, version_num ASC
  SQL="${SQL//$'\n'    /$'\n'}"
  SQL="${SQL#$'\n'}"
  SQL="${SQL%$'\n'}"
  case "$QRY_NAME" in
    anno )
      SQL="${SQL//<from>/anno_disclosed NATURAL JOIN anno_data}"
      SQL="${SQL//<date_col>/time_created}"
      SQL="${SQL//<extra_cols>/, details}"
      SQL="${SQL//<extra_where>/}"
      ;;
    retracted )
      SQL="${SQL//<from>/anno_stamps}"
      SQL="${SQL//<date_col>/st_at}"
      SQL="${SQL//<extra_cols>/, st_effts, st_detail}"
      SQL="${SQL//<extra_where>/" AND st_type = 'as:deleted'"}"
      ;;
    stamp )
      SQL="${SQL//<from>/anno_disclosed NATURAL JOIN anno_stamps}"
      SQL="${SQL//<date_col>/st_at}"
      SQL="${SQL//<extra_cols>/, st_type, st_effts, st_detail}"
      SQL="${SQL//<extra_where>/" AND st_type <> 'as:deleted'"}"
      ;;
    * )
      echo E: $FUNCNAME: "Unsupported query name: $QRY_NAME" >&2
      return 8;;
  esac
  echo "$SQL"
}


function dad_latest_dir_scan_double_digit_subdir () {
  local CUR= MAX=00
  for CUR in "$LATEST_DIR"[0-9][0-9]/; do
    [ -d "$CUR" ] || continue
    CUR="${CUR%/}"
    CUR="${CUR##*/}"
    # The '1' in front prevents bash from interpreting leading zero as octal.
    [ "1$CUR" -gt "1$MAX" ] && MAX="$CUR"
  done
  LATEST_DIR+="$MAX/"
}












daily_anno_dumper "$@"; exit $?
