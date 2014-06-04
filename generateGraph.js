var fs = require('fs-extra');
var util = require('util');

var file = __dirname + '/data/SemanticWebComplete.json';

fs.readFile(file, 'utf8', function(err, data) {
    if (err) {
        console.log('Error: ' + err);
        return;
    }

    var data = JSON.parse(data);

    var dataItems = data.result.hits.hit;

    var id = 0;

    var contributionIds = {};

    var nodes = {};
    var edges = {};

    var author;

    for (var i = 0; i < dataItems.length; i++) {
        //    for (var i = 0; i < 50; i++) {

        var item = dataItems[i];
        var itemId = item['@id'];

        if (!contributionIds[itemId] && item.info && item.info.authors && item.info.authors.author) {

            contributionIds[itemId] = true;

            var authors = item.info.authors.author;

            // Insert Authors as Nodes
            for (var j = 0; j < authors.length; j++) {

                author = authors[j];

                if (!nodes[author]) {
                    nodes[author] = {
                        id: 'n' + id,
                        label: author,
                        score: parseInt(item['@score'], 10),
                        contributions: 1
                    };

                    id += 1;

                } else {
                    nodes[author].score += parseInt(item['@score'], 10);
                    nodes[author].contributions += 1;
                }

            }

            // Insert Co-Authorship as Edges
            for (var k = 0; k < authors.length; k++) {

                author = authors[k];

                for (var l = 0; l < authors.length; l++) {

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

                if (!nodes[author]) {
                    nodes[author] = {
                        id: id,
                        label: author,
                        score: parseInt(item['@score'], 10),
                        contributions: 1
                    };

                    id += 1;

                } else {
                    nodes[author].score += parseInt(item['@score'], 10);
                    nodes[author].contributions += 1;
                }

            }

            util.print('.');
        }


    }

    var gefxExport = '<?xml version="1.0" encoding="UTF-8"?>\n';
    gefxExport    += '<gexf xmlns="http://www.gexf.net/1.2draft" version="1.2">\n';
    gefxExport    += '  <meta lastmodifieddate="2014-06-04">\n';
    gefxExport    += '      <creator>Simon Heimler</creator>\n';
    gefxExport    += '      <description>Semantic Web Author Graph</description>\n';
    gefxExport    += '  </meta>\n';
    gefxExport    += '  <graph mode="static" defaultedgetype="directed">\n';


    gefxExport    += '      <nodes>\n';
    for (var nodeId in nodes) {
        var node = nodes[nodeId];
        gefxExport    += '          <node id="' + node.id + '" label="' + node.label + '" />\n';
    }
    gefxExport    += '      </nodes>\n';


    gefxExport    += '      <edges>\n';
    for (var edgeId in edges) {
        var edge = edges[edgeId];
        gefxExport    += '          <edge id="' + edge.id + '" source="' + edge.source + '" target="' + edge.target + '" />\n';
    }
    gefxExport    += '      </edges>\n';


    gefxExport    += '  </graph>\n';
    gefxExport    += '</gexf>\n';

    fs.outputFileSync(__dirname + '/export/graph.gexf', gefxExport);
});

