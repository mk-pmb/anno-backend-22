// -*- coding: utf-8, tab-width: 2 -*-

const EX = {

  annoExactVerCond: (a, b, c) => (`"${a}"."base_id" = "${b}"."base_id" `
    + `AND "${a}"."version_num" = "${b}"."${c || 'version_num'}"`),

};


export default EX;
