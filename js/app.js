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


    console.log('Drawing Graph: ' + name);

    $('#graph').html('');

    sigma.parsers.gexf('data/layouted/' + name + '.gexf', {
            container: 'graph',
            settings: {
                defaultNodeColor: '#ec5148',
                minEdgeSize: 0.3,
                maxEdgeSize: 0.3,

                defaultLabelColor: '#fff',

                defaultLabelSize: 11,

                defaultLabelBGColor: '#fff',
                defaultLabelHoverColor: '#000',
                labelThreshold: 7,

                defaultEdgeType: 'curve',
                enableHovering: true,

                borderSize: 2,
                defaultNodeBorderColor: '#FFF',

                zoomMax: 16

            }
        },
        function(s) {
            // We first need to save the original colors of our
            // nodes and edges, like this:
            s.graph.nodes().forEach(function(n) {
                n.originalColor = n.color;
            });
            s.graph.edges().forEach(function(e) {
                e.originalColor = e.color;
            });

            // When a node is clicked, we check for each node
            // if it is a neighbor of the clicked one. If not,
            // we set its color as grey, and else, it takes its
            // original color.
            // We do the same for the edges, and we only keep
            // edges that have both extremities colored.
            s.bind('clickNode', function(e) {
                var nodeId = e.data.node.id,
                    toKeep = s.graph.neighbors(nodeId);
                toKeep[nodeId] = e.data.node;

                s.graph.nodes().forEach(function(n) {
                    if (toKeep[n.id])
                        n.color = n.originalColor;
                    else
                        n.color = '#333';
                });

                s.graph.edges().forEach(function(e) {
                    if (toKeep[e.source] && toKeep[e.target])
                        e.color = e.originalColor;
                    else
                        e.color = '#333';
                });

                // Since the data has been modified, we need to
                // call the refresh method to make the colors
                // update effective.
                s.refresh();
            });

            // When the stage is clicked, we just color each
            // node and edge with its original color.
            s.bind('clickStage', function(e) {
                s.graph.nodes().forEach(function(n) {
                    n.color = n.originalColor;
                });

                s.graph.edges().forEach(function(e) {
                    e.color = e.originalColor;
                });

                // Same as in the previous event:
                s.refresh();
            });
        }
    );
};

$(document).ready(function() {

    console.log(window.location.hash);

    var hash = window.location.hash;
    var graphName = hash.replace('#', '');

    if (!graphName) {
        graphName = 'SemanticWeb';
    }

    prepareGraph();
    drawGraph(graphName);

    $("#ISWC").on("click", function() {
        drawGraph('ISWC');
    });

    $("#ESWC").on("click", function() {
        drawGraph('ESWC');
    });

    $("#SemWeb").on("click", function() {
        drawGraph('SemanticWeb');
    });

    $("#SemWebTop").on("click", function() {
        drawGraph('SemanticWebTop');
    });
});
