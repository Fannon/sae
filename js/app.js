/* global $, document, sigma */

var prepareGraph = function() {
    // Add a method to the graph model that returns an
    // object with every neighbors of a node inside:
    sigma.classes.graph.addMethod('neighbors', function(nodeId) {
        var k,
            neighbors = {},
            index = this.allNeighborsIndex[nodeId] || {};

        for (k in index)
            neighbors[k] = this.nodesIndex[k];

        return neighbors;
    });
};

var drawGraph = function(name) {

    var edgeColor = '#777';
    var edgeMutedColor = '#222';
    var edgeActiveColor = '#AAA';

    $('#graph').html('');

    sigma.parsers.gexf('data/layouted/' + name + '.gexf', {

            container: 'graph',

            settings: {

                defaultNodeColor: '#ec5148',
                defaultNodeBorderColor: '#FFF',

                defaultLabelColor: '#fff',
                defaultLabelBGColor: '#fff',
                defaultLabelHoverColor: '#000',

                borderSize: 2,
                defaultLabelSize: 11,

                minEdgeSize: 0.2,
                maxEdgeSize: 2.4,
                edgeColor: "default",

                minNodeSize: 0.4,
                maxNodeSize: 8,

                enableHovering: true,

                labelThreshold: 10,

                doubleClickZoomingRatio: 4,
                zoomMin: 0.02,
                zoomMax: 2

            }
            // ,
            // renderer: {
            //     container: document.getElementById('graph'),
            //     type: 'canvas'
            // }
        },
        function(s) {

            window.s = s;

            s.graph.nodes().forEach(function(n) {
                n.originalColor = n.color;
            });
            s.graph.edges().forEach(function(e) {
                e.color = '#555';
                e.originalColor = e.color;

            });
            s.refresh();


            s.bind('clickNode', function(e) {
                var nodeId = e.data.node.id,
                    toKeep = s.graph.neighbors(nodeId);
                toKeep[nodeId] = e.data.node;

                console.log(e.data.node);

                // Print Node Infos to Detail Div
                var html = '';
                html += '<div class="node-title" style="border-color: ' + e.data.node.viz.color + '">' + e.data.node.label + '</div>';

                if (e.data.node.attributes.score) {
                    html += '<strong>Naive Score</strong>: ' + e.data.node.attributes.score + '<br>';
                }

                if (e.data.node.attributes['dblp score']) {
                    html += '<strong>DBLP Score</strong>: ' + e.data.node.attributes['dblp score'] + '<br>';
                }

                if (e.data.node.attributes['clustering coefficient'] || e.data.node.attributes['clustering coefficient'] === 0) {
                    html += '<strong>Local Clustering Coefficient</strong>: ' + Math.round(e.data.node.attributes['clustering coefficient']*100)/100 + '<br>';
                }

                // if (e.data.node.attributes['number of triangles']) {
                //     html += '<strong>DBLP Score</strong>: ' + e.data.node.attributes['number of triangles'] + '<br>';
                // }


                html += '<div class="publications-title"><strong>Publications</strong>: (' + e.data.node.attributes.contributions + ' total)</div>';

                // List Publications
                html += '<ol class="publications">';
                var pubArray = e.data.node.attributes.publications.split(';');
                for (var i = 0; i < pubArray.length; i++) {
                    var pub = pubArray[i];
                    html += '<li>' + pub + '</li>';
                }
                html += '</ol>';

                // List Connections
                // Color Nodes
                html += '<div class="connections-title"><strong>Connections</strong>:</div>';
                html += '<ul class="connections">';
                s.graph.nodes().forEach(function(n) {
                    if (toKeep[n.id]) {
                        n.color = n.originalColor;
                        html += '<li style="color:' + n.color + ';"><div style="color: #CCC">' + n.label + '</div></li>';
                    } else {
                        n.color = edgeMutedColor;
                    }
                });
                html += '</ul>';


                // Color Edges
                var nodes = s.graph.read('').nodesIndex;
                s.graph.edges().forEach(function(e) {
                    if (toKeep[e.source] && toKeep[e.target]) {
                        e.color = e.nodeColor;
                        e.color = nodes[e.source].color;
                    } else {
                        e.color = edgeMutedColor;
                    }

                });

                $('#node-details').html(html);

                s.refresh();
            });

            // If stage is clicked: Undo selection and coloring
            s.bind('clickStage', function(e) {
                s.graph.nodes().forEach(function(n) {
                    n.color = n.originalColor;
                });

                s.graph.edges().forEach(function(e) {
                    e.color = e.originalColor;
                });

                $('#node-details').html('');

                s.refresh();
            });
        }
    );
};
