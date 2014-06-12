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

                    // Last mentioned Author gets fixed Score of at least 8
                    if (j === authors.length -1 && score < 8) {
                        score = 8;
                    }

                    // If article was written by exactly 2 authors, both get score of 12
                    if (authors.length === 2) {
                        score = 12;
                    }

                    // Minimum Score is 1
                    if (score < 1) {
                        score = 1;
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

                        if (authorId !== secondAuthorId) {

                            if (!edges[edgeId] && !edges[edgeIdAlt]) {
                                edges[edgeId] = {
                                    id: edgeId,
                                    source: authorId,
                                    target: secondAuthorId,
                                    weight: 1
                                };
                            } else {
                                if (edges[edgeId]) {
                                    edges[edgeId].weight += 1
                                } else if (edges[edgeIdAlt]) {
                                    edges[edgeIdAlt].weight += 1
                                }
                            }

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
        gefxExport    += '  <graph mode="static" defaultedgetype="undirected">\n';
        gefxExport    += '      <attributes class="node">\n';
        gefxExport    += '          <attribute id="naive_score" title="Score" type="integer"/>\n';
        gefxExport    += '          <attribute id="dblp_score" title="dblp Score" type="integer"/>\n';
        gefxExport    += '          <attribute id="contributions" title="Contributions" type="integer"/>\n';
        gefxExport    += '          <attribute id="publications" title="Publications" type="string"/>\n';
        gefxExport    += '          <attribute id="size" title="size" type="integer"/>\n';
        gefxExport    += '      </attributes>\n';

        //////////////////////////////////////////
        // Export: Nodes                        //
        //////////////////////////////////////////

        gefxExport    += '      <nodes>\n';

        for (var nodeId in nodes) {

            var node = nodes[nodeId];

            gefxExport    += '          <node id="' + node.id + '" label="' + node.label + '">\n';
            gefxExport    += '              <attvalues>\n';
            gefxExport    += '                  <attvalue for="naive_score" value="' + Math.round(node.score) + '"/>\n';
            gefxExport    += '                  <attvalue for="dblp_score" value="' + Math.round(node.dblpScore) + '"/>\n';
            gefxExport    += '                  <attvalue for="contributions" value="' + node.contributions + '"/>\n';
            gefxExport    += '                  <attvalue for="publications" value="' + node.publications + '"/>\n';
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
            gefxExport    += '          <edge id="' + edge.id + '" source="' + edge.source + '" target="' + edge.target + '" weight="' + edge.weight + '" label="co-author" >\n';
            gefxExport    += '              <attvalues>\n';
            gefxExport    += '                  <attvalue for="4" value="' + edge.weight + '"/>\n';
            gefxExport    += '              </attvalues>\n';
            gefxExport    += '          </edge>\n';
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
