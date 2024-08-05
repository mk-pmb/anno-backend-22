// -*- coding: utf-8, tab-width: 2 -*-

// import eq from 'equal-pmb';

const EX = {

  ii: '/image,info',

  atVero: 'AtVeroEosEtAccusamusEtIustoOdioDignissimosDucimus,QuiBlanditiis'
    + 'PraesentiumVoluptatumDelenitiAtqueCorrupti,QuosDoloresEtQuasMolestias'
    + 'ExcepturiSint,ObcaecatiCupiditateNonProvident,SimiliqueSuntInCulpa,',
  quiOfficia: 'QuiOfficiaDeseruntMollitiaAnimi,IdEstLaborumEtDolorumFuga.Et'
    + 'HarumQuidemRerudumFacilisEstErtExpeditaDistinctio.NamLiberoTempore,Cum'
    + 'SolutaNobisEstEligendiOptio,CumqueNihilImpedit,QuoMinusId,QuodMaxime'
    + 'PlaceatFacerePossimus,OmnisVoluptasAssumendaEst,OmnisDolorRepellendaus.',
  temporibus: 'TemporibusAutemQuibusdamEtAutOfficiisDebitisAutRerumNecessitat,'
    + 'ibusSaepeEvenietUtEtVoluptatesRepudiandaeSintEtMolestiaeNonRecusandae.'
    + 'ItaqueEarumRerumHicTeneturASapienteDelectus,UtAutReiciendisVoluptatibus'
    + 'MaioresAliasConsequaturAutPerferendisDoloribusAsperioresRepellat.',

  diglitBaseUrl: 'https://digi.ub.uni-heidelberg.de/diglit/',
  bFunck: 'boerner1943_03_30/0006/Vg4BKIGFQyaNxtkXWE24FA',


  runTests(vsu, srv) {

    const bFunck = EX.diglitBaseUrl + EX.bFunck;

    function c(url, expectedBad) {
      const r = vsu(srv, c.svc, url);
      console.debug('\n?', url);
      if (r.bad === expectedBad) { return console.debug('+', expectedBad); }
      console.warn('!', { expectedBad, ...r });
    }
    c.svc = 'diglit';

    c('https://example.net/' + bFunck, 'Unexpected prefix');
    c(EX.diglitBaseUrl + '//' + EX.bFunck,
      'Sub URL contains forbidden token(s): doubleSlash');
    c(bFunck + '../../' + EX.ii, 'Not fully normalized');
    c(bFunck + '?s=' + EX.atVero);
    c(bFunck + '?s=' + EX.atVero + EX.quiOfficia,
      'Sub URL total length limit exceeded');

  },

};






export default EX;
