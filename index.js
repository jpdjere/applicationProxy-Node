var http = require('http');
var watson = require('watson-developer-cloud');
var qs = require('querystring');
var fs = require('fs');
var express = require('express');
var router = express.Router();

var wex = require('./routes/index');
var conversation = watson.conversation({
  username: '7f4dde73-bbe7-45c7-b8fb-0ab82d76ce72',
  password: '8sS43ajvvQmw',
  version: 'v1',
  version_date: '2016-09-20'
});
var workspaceID="f47b77c3-3297-4796-bf67-432dd606a07f";
var context;
var json = '';
var wexResponse = '';

//var logfile = fs.createWriteStream('./logfile.log');
var preguntas = fs.createWriteStream('./preguntas.log');

var wexResult = '';


router.get('/sendData', (req, res) => {

  // res.setHeader('Access-Control-Allow-Origin', '*');
  // // Request methods you wish to allow
  // res.setHeader('Access-Control-Allow-Methods', 'POST');
  // // Request headers you wish to allow
  // res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  // // Set to true if you need the website to include cookies in the requests sent
  // // to the API (e.g. in case you use sessions)
  // res.setHeader('Access-Control-Allow-Credentials', true);

    var message= req.query.msg;
    console.log(" ");
    console.log(" ");
    console.log(" ");
    console.log(" ");
    console.log(" ");
    console.log(" ");
    console.log(" ");
    console.log(" ");
    console.log(" ");
    console.log(" ");
    console.log("-----------------------------------");
    console.log("message: ");
    console.log(message);

    try {
          preguntas.write(message + "\n");
          console.log("message es: "+message);
    }catch(err) {
          console.log("Hay un error");
    }
      //-->JMC - Comentado hasta que este entrenado en fase I
    conversation.message({
      workspace_id: workspaceID,
      input: {'text': message},
      context: context
    },
    function(err, response) {
      if (err){
          json = JSON.stringify({
            Response:response,
            Code:400,
            DescriptionMessage:err
          });
          res.send(json);
          console.log(" ");
          console.log(" ");
          console.log(" ");
          console.log(" ");
          console.log(" ");
          console.log(" ");
          console.log(" ");
          console.log(" ");
          console.log(" ");
          console.log(" ");
          console.log("-----------------------------------");
          console.log('error:'+JSON.stringify(err, null, 2));
      }else{
          console.log('response: '+JSON.stringify(response, null, 2));
          context = response.context;
          console.log("confidence is: ",response.intents[0].confidence)

          //Si la confidence de Conversation es mayor o igual a 0.7 devuelvo el msj de Conversation
          if(response.intents[0].confidence >= 0.8){
            console.log("I'm in");
            // res.writeHead(200, {"Content-Type": "application/json"});
            json = JSON.stringify({
              Response:response,
              Code:200,
              DescriptionMessage:"OK"
            });
            res.send(json);
          }
          //Si la confidence de Conversation es menor voy a buscar a WEX y traigo los resultados
          else if(response.intents[0].confidence < 0.8){

            //Creo el queryObject con AND como operator
            var regex = /\.|\?|\!/;
            var result = message.replaceAll(regex,"");
            var messageArray = result.split(" ");
            var queryObjectAND = '<operator logic="and">';
            for(var i = 0;i<messageArray.length;i++){
              queryObjectAND += `<term field="query" str="${messageArray[i]}" position="${i}"/>`;
            }
            queryObjectAND += '</operator>';

            //Creo el queryObject con OR como operator
            var queryObjectOR = "";
            queryObjectOR += queryObjectAND;
            regex = /<operator logic="and">/;
            queryObjectOR = queryObjectOR.replaceAll(regex,'<operator logic="or">');

            //Creo variable para resultados con AND. Esto voy a chequiar si trajo algo y si no, tiro el OR
            wexResponse = "";

            wex.listarDocumentos(queryObjectAND,5).then((result)=>{
              console.log("wexANDResponse: ");
              console.log(result);
              //Parseo la respuesta para eliminar indeseados y converitr a JSON
              result = JSON.stringify(result, null, 2);
              var regex = /\\n|<td>|<\/td>|<div>|<\/div>|<font>|<\/font>|<\/p>|<p>/;
              result = result.replaceAll(regex,"");
              var regex = /<br>|<br >|<\/br>|<\/ br>|<br\/>/;
              result = result.replaceAll(regex," ");
              wexResponse = result;

              console.log(" ");
              console.log(" ");
              console.log(" ");
              console.log(" -----  wexResponse -------");
              console.log(wexResponse);
              if(wexResponse.Datos.Documentos.length === 0){

                wex.listarDocumentos(queryObjectOR,5).then((result)=>{
                  console.log("wexORResponse: ");
                  console.log(result);
                  //Parseo la respuesta para eliminar indeseados y converitr a JSON
                  result = JSON.stringify(result, null, 2);
                  var regex = /\\n|<td>|<\/td>|<div>|<\/div>|<font>|<\/font>|<\/p>|<p>/;
                  result = result.replaceAll(regex,"");
                  var regex = /<br>|<br >|<\/br>|<\/ br>|<br\/>/;
                  result = result.replaceAll(regex," ");
                  wexResponse = result;
                })
              };
              res.send(wexResponse);
            })

          }
          //Si es menor a 0.6, devuelvo el mensaje de Conversation de "No entendi"
          //IDEAA: definir entre 0.5 y 0.7 el rango de respuestas a WEX como primer IF
          // y que el Else sea Conversation normal
          else{
            console.log("IM Out");
          }


      }

  })

});

router.get('/', (req, res) => {
  // res.writeHead(200,{'Content-Type':'text/plain'});
  res.send('Servidor corriendo22!!');
})

//Creo funcion para reemplazar todas las instancias de algo en un string.
String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};


module.exports = router;
