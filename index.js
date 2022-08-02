const functions = require('@google-cloud/functions-framework');
const {google} = require("googleapis");
const gdoctableapp = require('./table_api');


/**
 * Responds to an HTTP request using data from the request body parsed according
 * to the "content-type" header.
 *
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
functions.http('createContentPlanDoc', async (req, res) => {
    const auth = await google.auth.getClient({
    scopes: [
        "https://www.googleapis.com/auth/documents"
        ]
    });
    
    const table = {
        auth: auth,
        documentId: req.body.tableDocID,
        tableIndex: 0
    };
    gdoctableapp.GetValues(table, function(err, result) {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        console.log(result.values);
        const regex = /{{(.*?)}}/;
        const newValues = result.values.map(v => {
            const match = v[1].match(regex);
            console.log(match);
            
            if(!match) {
                return v;
            }
            const incoming = req.body[match[1]];
            console.log(incoming);
            if(!incoming) {
                return [v[0], v[1].replace(regex, "")];
            }
            return [v[0], v[1].replace(regex, incoming)];
        })
        const resource = {
            auth: auth,
            documentId: req.body.outlineDocID,
            rows: result.values.length,
            columns: 2,
            append: true,
            values: newValues
          };
          gdoctableapp.CreateTable(resource, function(err, result2) {
            if (err) {
              console.log(err);
              return res.status(500).send(err);
            }
            console.log(result2); 
            res.send(result2);
          });
    });
    
});