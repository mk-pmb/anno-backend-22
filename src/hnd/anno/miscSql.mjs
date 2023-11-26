// -*- coding: utf-8, tab-width: 2 -*-

const EX = {

  annoExactVerCond: (a, b, c) => (`"${a}"."base_id" = "${b}"."base_id" `
    + `AND "${a}"."version_num" = "${b}"."${c || 'version_num'}"`),


  joinStampEffUts0(joinAs, stType) {
    const col = `COALESCE(${joinAs}.st_effuts, 0) AS "${joinAs}Ts"`;
    const join = (`LEFT JOIN "anno_stamps_effuts" AS "${joinAs}"`
      + ' ON ' + EX.annoExactVerCond(joinAs, 'da')
      + ` AND "${joinAs}"."st_type" = '${stType}'`);
    return {
      col,
      colLn: '\n    ' + col + ',',
      join,
    };
  },


};


export default EX;
