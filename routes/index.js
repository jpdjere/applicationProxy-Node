var express = require('express');
var router = express.Router();
var watson = require('watson-developer-cloud');
var request = require('request');
var _ = require('underscore');
var parseString = require('xml2js').parseString;
//-------Para parsear listDocument-----------//
var xml2js = require('xml2js');
var parser = new xml2js.Parser({strict:false});
//---------GLOBALES----------//
var a = '';
var respuesta = '';
var config = {};
// config.END_POINT_BUSQUEDAS = "http://sirius.mybluemix.net/ListarBusquedasSugeridas";
config.END_POINT_BUSQUEDAS = "http://192.168.1.29:9080/vivisimo/cgi-bin/velocity.exe";
// config.END_POINT_DOCUMENTOS="http://sirius.mybluemix.net/LIstarDocumentos";
config.END_POINT_DOCUMENTOS="http://192.168.1.29:9080/vivisimo/cgi-bin/velocity.exe";
config.sugerencias_dic="dic-general";
config.sugerencias_user="api-user";
config.sugerencias_pwd="TH1nk1710";
config.documentos_user="api-user";
config.documentos_pwd="TH1nk1710";

var INDEXED_ONTOLECTION_NAME = "iopro-tm-gcba-terms";
var SEARCH_COLLECTION_NAME = "gcba-servicio";

var ontolectionsXML =
`
<declare name="query-expansion.enabled" /> <set-var name="query-expansion.enabled">true</set-var>
<declare name="query-expansion.user-profile" /> <set-var name="query-expansion.user-profile">on</set-var>
<declare name="query-expansion.ontolections" /> <set-var name="query-expansion.ontolections">iopro-tm-gcba-terms</set-var>
<declare name="query-expansion.max-terms-per-type" /> <set-var name="query-expansion.max-terms-per-type">20</set-var>
<declare name="query-expansion.suggestion" /> <set-var name="query-expansion.suggestion"></set-var>
<declare name="query-expansion.query-match-type" /> <set-var name="query-expansion.query-match-type">terms</set-var>
<declare name="query-expansion.conceptual-search-similarity-threshold" /> <set-var name="query-expansion.conceptual-search-similarity-threshold">0.7</set-var>
<declare name="query-expansion.conceptual-search-metric" /> <set-var name="query-expansion.conceptual-search-metric">euclidean-dot-product</set-var>
<declare name="query-expansion.conceptual-search-candidates-max" /> <set-var name="query-expansion.conceptual-search-candidates-max">euclidean-dot-product</set-var>
<declare name="query-expansion.conceptual-search-sources" /> <set-var name="query-expansion.conceptual-search-sources">gcba-servicio</set-var>
<declare name="query-expansion.stem-expansions" /> <set-var name="query-expansion.stem-expansions">false</set-var>
<declare name="query-expansion.stemming-weight" /> <set-var name="query-expansion.stemming-weight">0.5</set-var>
<declare name="query-expansion.stemming-dictionary"/> <set-var name="query-expansion.stemming-dictionary">english/wildcard.dict</set-var>
<declare name="query-expansion.automatic" /> <set-var name="query-expansion.automatic">narrower:0.9|synonym:0.8|spelling:0.8|translation:0.5|broader:0.8|related:0.2</set-var>
`;


//------------------ DEFINO EL QUERY A HACER Y LA COLECCION A APUNTAR ---------------//

var sources = 'gcba-servicio';
var str = 'tarjeta'; //Para listarBusquedasSugeridas

let listarDocumentos = (message,numDocs) =>{

  return new Promise(
      (resolve, reject) => {
    request.post({
      headers: {'content-type' : 'application/x-www-form-urlencoded'},
      url:     config.END_POINT_DOCUMENTOS,
      form: {
        //Indica el protocolo a utilizar (SOAP/REST). Valor a utilizar: api-rest
        'v.app': 'api-rest',
        //Indica la operación a ejecutar. Valor a utilizar: autocomplete-suggest
        'v.function': 'query-search',
        // Indica los caracteres ingresados por el usuario y a partir de los cuales se deben obtener las sugerencias.
        // Este valor corresponde al parámetro Parametros.Terminos del objeto JSON recibido en I1.
        // 'nvps.query' : datos.getTerminos();
        // 'query' : message,
        //Query object es la alternativa a 'query' y permite meter los terminos directamente con el logicoperator
        'query-object':message,
        // Collecciones de WEX donde buscar. LO REEMPLAZO POR DUMMY DATA ABAJO
        // 'nvps.sources' : properties.getProperty("listar_doc_sources");
        'sources' : sources,
        // Indica el número de sugerencias que se solicita. El valor por default es 10.
        // Este valor corresponde al parámetro Parametros.CantidadSugerencias del objeto JSON recibido en I1.
        // nvps.num : datosDocsRequest.getCantidadDocumentos(),
        'num' : numDocs,
        //User y Pass. Definidos.
        //Indica el nombre de usuario. Valor a utilizar: api-user.
        //Este valor debe obtenerse a partir del uso de la clase ContextDelivery.
        'v.username' : config.documentos_user,
        // Indica el nombre de usuario. Valor a utilizar: TH1nk1710.
        // Este valor debe obtenerse a partir del uso de la clase ContextDelivery.
        'v.password' : config.documentos_pwd,
        // 'query-modification-macros':'enhance-query-with-querymodifier query-modification-expansion',
        'query-modification-macros':'query-modification-expansion',
        'extra-xml':ontolectionsXML

      }
    }, (error, response, body) => {

      console.log("-----------------------------------");
      console.log("-----------------------------------");
      console.log("XML body:   ");
      console.log(body);
      //Parseo el XML
      parser.parseString(body,function (err, result) {

        console.log("-----------------------------------");
        console.log("-----------------------------------");
        console.log("-----------------------------------");
        console.log("Parsed result is:");
        console.log(result);
        console.log("-----------------------------------");
        console.log(JSON.stringify(result,null,2));
        console.log("-----------------------------------");
        console.log("-----------------------------------");
        console.log("-----------------------------------");
        respuesta =
        {

          Datos: {
            Documentos:[
              // {
              //   'URL':'',
              //   Titulo:'',
              //   ParrafoDestacado:'',
              //   TipoDocumento:''
              // }

            ],
            Code:"",
            DescriptionMessage:""

          },



        };

        //Creo el objeto parseado a JSON para recorrerlo
        a = result;
        //Intento poblar Datos con frases. Si WEX no dio respuesta, la variable queda vacia
        try_catch_else_finally(function() {
          // protected block
          for(var i = 0;i<a["QUERY-RESULTS"].LIST[0].DOCUMENT.length;i++){
            tempDoc = {};
            //Busco URL desde $
            tempDoc["URL"] = a["QUERY-RESULTS"].LIST[0].DOCUMENT[i].$["URL"];
            //Defino Content para hacer las busquedas que correspondan con Underscore
            contentArray = a["QUERY-RESULTS"].LIST[0].DOCUMENT[i].CONTENT;
            //Busco el array correspondiente y pusheo el valor que necesito.
            foundArray = _.find(contentArray, function(obj) { return obj.$.NAME == 'title' })
            tempDoc["Titulo"] = foundArray._;
            foundArray = _.find(contentArray, function(obj) { return obj.$.NAME == 'snippet' })
            tempDoc["ParrafoDestacado"] = foundArray._;
            foundArray = _.find(contentArray, function(obj) { return obj.$.NAME == 'filetype' })
            try{
              tempDoc["TipoDocumento"] = convertDocType(foundArray._);
            }catch(e){
              console.log("Error on reading Document Type: "+e);
              tempDoc["TipoDocumento"] = "Unrecognized File type";
            }
            respuesta.Datos.Documentos.push(tempDoc);
            respuesta.Datos.Code = 200;
            respuesta.Datos.DescriptionMessage = 'OK';
          }
          resolve(respuesta);

        }, function(e) {
          console.log("Exception was: ");
          console.log(e);
          console.log("No se lleno el Objeto de resultados de WEX");
          respuesta.Datos.Documentos.push({"URL":"",Titulo:"",ParrafoDestacado:"",TipoDocumento:""})
          respuesta.Datos.Code = 404;
          respuesta.Datos.DescriptionMessage = 'No results returned from WEX';
          resolve(respuesta);
        }, function() {
          console.log("error");
          // else block
        }, function() {
          // final-block
        });

      })

    });

  });

}

let listarBusquedasSugeridas = (datos) => {
  return new Promise(
    (resolve, reject) => {


      request.post({
        headers: {'content-type' : 'application/x-www-form-urlencoded'},
        url:     config.END_POINT_BUSQUEDAS,
        form: {
          //Indica el protocolo a utilizar (SOAP/REST). Valor a utilizar: api-rest
          'v.app': 'api-rest',
          //Indica la operación a ejecutar. Valor a utilizar: autocomplete-suggest
          'v.function': 'autocomplete-suggest',
          // Indica el diccionario a utilizar. Valor a utilizar: dic-general.
          // Es deseable que este valor no esté en duro en el código.
          'dictionary': 'dic-general',
          // Indica los caracteres ingresados por el usuario y a partir de los cuales se deben obtener las sugerencias.
          // Este valor corresponde al parámetro Parametros. Terminos del objeto JSON recibido en I1.
          'str' : str,
          // Indica el número de sugerencias que se solicita. El valor por default es 10.
          // Este valor corresponde al parámetro Parametros.CantidadSugerencias del objeto JSON recibido en I1.
          'num' : 5,
          // Indica si se debe respetar el orden de los términos listados en str. El valor por default es false.
          // Este valor corresponde al parámetro Parametros.RespetarOrden del objeto JSON recibido en I1.
          'bag-of-words' : false,
          //User y Pass. Definidos.
          //Indica el nombre de usuario. Valor a utilizar: api-user.
          //Este valor debe obtenerse a partir del uso de la clase ContextDelivery.
          'v.username' : config.documentos_user,
          // Indica el nombre de usuario. Valor a utilizar: TH1nk1710.
          // Este valor debe obtenerse a partir del uso de la clase ContextDelivery.
          'v.password' : config.documentos_pwd,

        }
      }, (error, response, body) => {
        // PARSEO EL STRING
        // parseString(res.body, function (err, result) {
        //   console.dir(result);
        // });
        console.log("--------------------------XML-------------------");
        console.log(body)
        // a = JSON.stringify(body);
        // PARSEO EL STRING
        parseString(body, function (err, result) {


          var respuesta = {
            BGBAResultadoOperacion:{
              Severidad: '',
              Codigo: '',
              Descripcion: '',
              Tipo: '',
              URLDetalle: '',
              IdRespuesta: '',
              NombreProveedor: ''
            },
            Datos: {
              Sugerencias:[

              ]
            },
            BGBAResultadoOperacionLog:{
              LogItem: [{
                Severidad:'',
                Codigo:'',
                Descripcion:'',
                Tipo:'',
                URLDetalle:''
                }
              ]
            }
          };

          console.log("--------------------------JSON-------------------");
          console.log(result);
          a = result;

          //Intento poblar Datos con frases. Si WEX no dio respuesta, la variable queda vacia
          try{
            for(var i = 0;i<a.suggestions.suggestion.length;i++){
              console.log(a.suggestions.suggestion[i].phrase);
              respuesta.Datos.Sugerencias.push({"Frase":a.suggestions.suggestion[i].phrase[0]});
            }
          }catch(error){
            console.log(error)
          }
          a = respuesta;
        });

        resolve(a);
      });


    })

}



router.get('/listarBusquedasSugeridas',(req, res, next) =>{
  listarBusquedasSugeridas().then(()=>{
    res.send(a);
  });
});

router.get('/listarDocumentos',(req, res, next) =>{
  listarDocumentos().then(()=>{
    res.send(a);
  });
});


let convertDocType = y =>{
  // console.log("---------------------------")
  // console.log(y)
  x = y.toUpperCase();
  if(x === 'HTML' || x === 'html' || x === 'text/html'){
    return 'H'
  }
  if(x === 'PDF' || x === 'pdf'){
    return 'P'
  }
  if(x === 'EXCEL' || x === 'xls' || x === 'xlsx' || x === 'XLS' || x === 'XLSX'){
    return 'E'
  }else{
  }
  if(x === 'WORD' || x === 'doc'|| x === 'docx' || x === 'DOC' || x === 'DOCX'){
    return 'W'
  }else{
    return "Unrecognized File type"
  }
}

var try_catch_else_finally = function(protected_code, handler_code, else_code, finally_code) {
  try {
    var success = true;
    try {
      protected_code();
    } catch(e) {
      success = false;
      handler_code({"exception_was": e});
    }
    if(success) {
      else_code();
    }
  } finally {
    finally_code();
  }
};

//Creo funcion para reemplazar todas las instancias de algo en un string.
String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

module.exports = {router,listarDocumentos,listarBusquedasSugeridas}
