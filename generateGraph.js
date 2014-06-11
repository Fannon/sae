//////////////////////////////////////////
// Imports                              //
//////////////////////////////////////////

var fs = require('fs-extra');
var util = require('util');

//////////////////////////////////////////
// Config                               //
//////////////////////////////////////////

/**
 * Files to import
 * Will read json files coming from dblp stored the folder /data/import
 * Will export to /data/export in gexf format (http://gexf.net/format/) for use with Gephi
 * @type {Array}
 */
var fileNames = [
    'SemanticWebComplete',
    'ESWC',
    'ISWC'
];

// 70% of the score is inherited by the next author
var scoreRemainder = 0.7;
var citaviJunk = 'Titel anhand dieser DOI in Citavi-Projekt übernehmen  ';

//////////////////////////////////////////
// Variables                            //
//////////////////////////////////////////

var processFile;


//////////////////////////////////////////
// Logic                                //
//////////////////////////////////////////


processFile = function(fileName) {

    var file = __dirname + '/data/import/' + fileName + '.json';

    fs.readFile(file, 'utf8', function(err, data) {
        "use strict";

        if (err) {
            console.log('Error: ' + err);
            return;
        }

        util.print('Processing ' + fileName);


        //////////////////////////////////////////
        // Calculations                         //
        //////////////////////////////////////////

        var data = JSON.parse(data);

        var dataItems = data.result.hits.hit;

        var id = 0;

        var contributionIds = {};

        var nodes = {};
        var edges = {};

        var author;

        for (var i = 0; i < dataItems.length; i++) {

            var item = dataItems[i];
            var itemId = item['@id'];

            var score = 16;

            if (!contributionIds[itemId] && item.info && item.info.authors && item.info.authors.author) {

                contributionIds[itemId] = true;

                var authors = item.info.authors.author;

                // Insert Authors as Nodes
                for (var j = 0; j < authors.length; j++) {

                    author = authors[j];

                    if (j === authors.length -1) {
                        score = 8; // Last mentioned Author gets fixed Score of 8
                    }

                    if (authors.length === 2) {
                        score = 12;
                    }

                    if (!nodes[author]) {
                        nodes[author] = {
                            id: 'n' + id,
                            label: author,
                            dblpScore: parseInt(item['@score'], 10),
                            score: score,
                            contributions: 1,
                            publications: item.info.title.text.replace(citaviJunk, '').trim()
                        };

                        id += 1;

                    } else {
                        nodes[author].dblpScore += parseInt(item['@score'], 10);
                        nodes[author].score += score;
                        nodes[author].contributions += 1;
                        nodes[author].publications += ';' + item.info.title.text.replace(citaviJunk, '').trim();
                    }

                    score = score * scoreRemainder;

                }

                // Insert Co-Authorship as Edges
                for (var k = 0; k < authors.length; k++) {

                    author = authors[k];

                    for (var l = 1; l < authors.length; l++) {

                        var secondAuthor = authors[l];

                        var authorId = nodes[author].id;
                        var secondAuthorId = nodes[secondAuthor].id;

                        var edgeId = authorId + '-' + secondAuthorId;
                        var edgeIdAlt = secondAuthorId + '-' + authorId;

                        if ((authorId !== secondAuthorId) && !edges[edgeId] && !edges[edgeIdAlt]) {
                            edges[edgeId] = {
                                id: edgeId,
                                source: authorId,
                                target: secondAuthorId
                            };
                        }

                    }

                }

                util.print('.');
            }

        }
        util.print('\n\n');

        //////////////////////////////////////////
        // Export: Header                       //
        //////////////////////////////////////////

        var gefxExport = '\ufeff<?xml version="1.0" encoding="UTF-8"?>\n';
        gefxExport    += '<gexf xmlns="http://www.gexf.net/1.2draft" version="1.2">\n';
        gefxExport    += '  <meta lastmodifieddate="2014-06-04">\n';
        gefxExport    += '      <creator>Simon Heimler</creator>\n';
        gefxExport    += '      <description>Semantic Web Author Graph</description>\n';
        gefxExport    += '  </meta>\n';
        gefxExport    += '  <graph mode="static" defaultedgetype="directed">\n';
        gefxExport    += '      <attributes class="node">\n';
        gefxExport    += '          <attribute id="0" title="Score" type="integer"/>\n';
        gefxExport    += '          <attribute id="1" title="dblpScore" type="integer"/>\n';
        gefxExport    += '          <attribute id="2" title="Contributions" type="integer"/>\n';
        gefxExport    += '          <attribute id="3" title="Publications" type="string"/>\n';
        gefxExport    += '      </attributes>\n';

        //////////////////////////////////////////
        // Export: Nodes                        //
        //////////////////////////////////////////

        gefxExport    += '      <nodes>\n';

        for (var nodeId in nodes) {

            var node = nodes[nodeId];

            gefxExport    += '          <node id="' + node.id + '" label="' + node.label + '">\n';
            gefxExport    += '              <attvalues>\n';
            gefxExport    += '                  <attvalue for="0" value="' + Math.round(node.score) + '"/>\n';
            gefxExport    += '                  <attvalue for="1" value="' + Math.round(node.dblpScore) + '"/>\n';
            gefxExport    += '                  <attvalue for="2" value="' + node.contributions + '"/>\n';
            gefxExport    += '                  <attvalue for="3" value="' + node.publications + '"/>\n';
            gefxExport    += '              </attvalues>\n';
            gefxExport    += '          </node>\n';
        }
        gefxExport    += '      </nodes>\n';

        //////////////////////////////////////////
        // Export: Edges                        //
        //////////////////////////////////////////

        gefxExport    += '      <edges>\n';
        for (var edgeId in edges) {
            var edge = edges[edgeId];
            gefxExport    += '          <edge id="' + edge.id + '" source="' + edge.source + '" target="' + edge.target + '" />\n';
        }
        gefxExport    += '      </edges>\n';


        //////////////////////////////////////////
        // Export: Footer                       //
        //////////////////////////////////////////

        gefxExport    += '  </graph>\n';
        gefxExport    += '</gexf>\n';

        fs.outputFileSync(__dirname + '/data/export/' + fileName + '.gexf', gefxExport);
    });
};


//////////////////////////////////////////
// Execute                              //
//////////////////////////////////////////

for (var f = 0; f < fileNames.length; f++) {
    var filename = fileNames[f];
    processFile(filename);
}
