'use strict';

require('../../../TestHelper');

/* global bootstrapModeler, inject */


var coreModule = require('lib/core'),
    bendpointsModule = require('diagram-js/lib/features/bendpoints'),
    modelingModule = require('lib/features/modeling'),
    labelEditingModule = require('lib/features/label-editing'),
    spaceTool = require('diagram-js/lib/features/space-tool');

var canvasEvent = require('../../../util/MockEvents').createCanvasEvent;

var testModules = [
  coreModule,
  modelingModule,
  labelEditingModule,
  bendpointsModule,
  spaceTool
];


describe('modeling - label layouting', function() {

  describe('should position created label', function() {

    var diagramXML = require('./LabelLayouting.initial.bpmn');

    beforeEach(bootstrapModeler(diagramXML, {
      modules: testModules
    }));


    it('horizontal', inject(function(modeling, elementRegistry) {

      // given
      var element1 = elementRegistry.get('StartEvent_1'),
          element2 = elementRegistry.get('ExclusiveGateway_2');

      // when
      var connection = modeling.connect(element1, element2);

      // then
      expect(connection.label.x).to.be.equal(472);
      expect(connection.label.y).to.be.within(335, 336);
    }));


    it('vertical', inject(function(modeling, elementRegistry) {

      // given
      var element1 = elementRegistry.get('StartEvent_1'),
          element2 = elementRegistry.get('ExclusiveGateway_1');

      // when
      var connection = modeling.connect(element1, element2);

      // then
      expect(connection.label.x).to.be.equal(337);
      expect(connection.label.y).to.be.within(222, 224);
    }));

  });


  describe('should move label', function() {

    var diagramXML = require('./LabelLayouting.move.bpmn');

    beforeEach(bootstrapModeler(diagramXML, {
      modules: testModules
    }));

    describe('on segment move', function() {

      it('label name not set -> move label to waypoints mid', inject(function(modeling, elementRegistry, connectionSegmentMove, dragging) {

        // given
        var connection = elementRegistry.get('SequenceFlow_C'),
            labelPosition = getLabelPosition(connection);

        connection.label.businessObject.name = false;
        connection.label.hidden = true;

        // when
        connectionSegmentMove.start(canvasEvent({ x: 0, y: 0 }), connection, 2);

        dragging.move(canvasEvent({ x: 0, y: 50 }));

        dragging.end();

        // then
        expect(connection.label.y - labelPosition.y).to.be.within(13, 16);
        expect(connection.label.x - labelPosition.x).to.be.within(-87, -85);
      }));


      it('left - no relayout', inject(function(elementRegistry, connectionSegmentMove, dragging) {

        // given
        var connection = elementRegistry.get('SequenceFlow_B'),
            labelPosition = getLabelPosition(connection);

        // when
        connectionSegmentMove.start(canvasEvent({ x: 0, y: 0 }), connection, 2);

        dragging.move(canvasEvent({ x: -30, y: 0 }));

        dragging.end();

        // then
        expectLabelMoved(connection, labelPosition, { x: -30, y: 0 });
      }));


      it('left - remove bendpoint', inject(function(elementRegistry, connectionSegmentMove, dragging) {

        // given
        var connection = elementRegistry.get('SequenceFlow_B'),
            labelPosition = getLabelPosition(connection);

        // when
        connectionSegmentMove.start(canvasEvent({ x: 0, y: 0 }), connection, 2);

        dragging.move(canvasEvent({ x: -70, y: 0 }));

        dragging.end();

        // then
        expectLabelMoved(connection, labelPosition, { x: -70, y: 24 });
      }));


      it('right - no relayout', inject(function(elementRegistry, connectionSegmentMove, dragging) {

        // given
        var connection = elementRegistry.get('SequenceFlow_B'),
            labelPosition = getLabelPosition(connection);

        // when
        connectionSegmentMove.start(canvasEvent({ x: 0, y: 0 }), connection, 2);

        dragging.move(canvasEvent({ x: 30, y: 0 }));

        dragging.end();

        // then
        expectLabelMoved(connection, labelPosition, { x: 30, y: 0 });
      }));


      it('right - remove bendpoint', inject(function(elementRegistry, connectionSegmentMove, dragging) {

        // given
        var connection = elementRegistry.get('SequenceFlow_B'),
            labelPosition = getLabelPosition(connection);

        // when
        connectionSegmentMove.start(canvasEvent({ x: 0, y: 0 }), connection, 2);

        dragging.move(canvasEvent({ x: 70, y: 0 }));

        dragging.end();

        // then
        expectLabelMoved(connection, labelPosition, { x: 70, y: -16 });
      }));


      it('down', inject(function(elementRegistry, connectionSegmentMove, dragging) {

        // given
        var connection = elementRegistry.get('SequenceFlow_C'),
            labelPosition = getLabelPosition(connection);

        // when
        connectionSegmentMove.start(canvasEvent({ x: 0, y: 0 }), connection, 2);

        dragging.move(canvasEvent({ x: 0, y: 70 }));

        dragging.end();

        // then
        expectLabelMoved(connection, labelPosition, { x: 0, y: 70 });

      }));


      it('up - remove two bendpoints', inject(function(elementRegistry, connectionSegmentMove, dragging) {

        // given
        var connection = elementRegistry.get('SequenceFlow_C'),
            labelPosition = getLabelPosition(connection);

        // when
        connectionSegmentMove.start(canvasEvent({ x: 0, y: 0 }), connection, 2);

        dragging.move(canvasEvent({ x: 0, y: -90 }));

        dragging.end();

        // then
        expectLabelMoved(connection, labelPosition, { x: -39, y: -85 });

      }));


      // TODO(@janstuemmel): solve by connectionSegmentMove refactoring
      it('up - remove two bendpoints - redundant waypoints', inject(function(elementRegistry, connectionSegmentMove, dragging, bendpointMove) {

        // given
        var connection = elementRegistry.get('SequenceFlow_C');

        bendpointMove.start(canvasEvent({ x: 0, y: 0 }), connection, 1);
        dragging.move(canvasEvent({ x: 620, y: 435 }));
        dragging.end();

        bendpointMove.start(canvasEvent({ x: 0, y: 0 }), connection, 2);
        dragging.move(canvasEvent({ x: 300, y: 435 }));
        dragging.end();

        var labelPosition = getLabelPosition(connection);

        // when
        connectionSegmentMove.start(canvasEvent({ x: 0, y: 0 }), connection, 2);
        dragging.move(canvasEvent({ x: 0, y: -160 }));
        dragging.end();

        // then
        expect(getLabelPosition(connection)).to.not.eql(labelPosition);

      }));

    });


    describe('on reconnect', function() {

      it('start', inject(function(elementRegistry, modeling) {

        // given
        var connection = elementRegistry.get('SequenceFlow_D'),
            shape = elementRegistry.get('Task_1');

        // when
        modeling.reconnectStart(connection, shape, { x: 0, y: 0 });

        // then
        expect(Math.round(connection.label.x)).to.be.within(570, 575);
        expect(Math.round(connection.label.y)).to.be.within(138, 139);

      }));


      it('end', inject(function(elementRegistry, modeling) {

        // given
        var connection = elementRegistry.get('SequenceFlow_A'),
            shape = elementRegistry.get('Task_2');

        // when
        modeling.reconnectEnd(connection, shape, { x: 294, y: 270 });

        // then
        expect(Math.round(connection.label.x)).to.be.within(257, 260);
        expect(Math.round(connection.label.y)).to.be.within(185, 186);

      }));

    });


    describe('on shape move', function() {

      it('down', inject(function(elementRegistry, modeling) {

        // given
        var connection = elementRegistry.get('SequenceFlow_E'),
            shape = elementRegistry.get('Task_4'),
            labelPosition = getLabelPosition(connection);

        // when
        modeling.moveShape(shape, { x: 0, y: 100 });

        // then
        expectLabelMoved(connection, labelPosition, { x: 0, y: 100 });

      }));

    });


    describe('on bendpoint add/delete/moving', function() {


      it('move, label on segment', inject(function(elementRegistry, bendpointMove, dragging) {

        // given
        var connection = elementRegistry.get('SequenceFlow_B');

        // when
        bendpointMove.start(canvasEvent({ x: 0, y: 0 }), connection, 1);

        dragging.move(canvasEvent({ x: 455 + 50, y: 120 }));

        dragging.end();

        // then
        expect(Math.round(connection.label.x)).to.be.within(466, 468);
        expect(Math.round(connection.label.y)).to.be.within(170, 171);

      }));


      it('move, label on bendpoint', inject(function(elementRegistry, bendpointMove, dragging, modeling) {

        // given
        var connection = elementRegistry.get('SequenceFlow_C');

        // label out of segments, on a bendpoint (idx=1)
        modeling.moveShape(connection.label, { x: 40, y: 0 });

        // when
        bendpointMove.start(canvasEvent({ x: 0, y: 0 }), connection, 1);

        dragging.move(canvasEvent({ x: 455 + 50, y: 500 }));

        dragging.end();

        // then
        expect(Math.round(connection.label.x)).to.be.within(517, 519);
        expect(Math.round(connection.label.y)).to.be.equal(507);

      }));


      it('remove bendpoint when label on segment', inject(function(elementRegistry, bendpointMove, dragging) {

        // given
        var connection = elementRegistry.get('SequenceFlow_B');

        // when
        bendpointMove.start(canvasEvent({ x: 0, y: 0 }), connection, 1);

        dragging.move(canvasEvent({ x: 455, y: 120 + 160 }));

        dragging.end();

        // then
        expect(Math.round(connection.label.x)).to.be.within(418, 421);
        expect(Math.round(connection.label.y)).to.be.equal(191);

      }));


      it('add bendpoint, label on right segment', inject(function(elementRegistry, bendpointMove, dragging, canvas) {

        // given
        var connection = elementRegistry.get('SequenceFlow_A');

        // when
        bendpointMove.start(canvasEvent({ x: 0, y: 0 }), connection, 1, true);

        dragging.hover({
          element: connection,
          gfx: canvas.getGraphics(connection)
        });

        dragging.move(canvasEvent({ x: 220, y: 200 }));

        dragging.end();

        // then
        expect(Math.round(connection.label.x)).to.be.within(248, 251);
        expect(Math.round(connection.label.y)).to.be.equal(152);

      }));


      it('add bendpoint, label on left segment', inject(function(elementRegistry, bendpointMove, dragging, canvas) {

        // given
        var connection = elementRegistry.get('SequenceFlow_A');

        // when
        bendpointMove.start(canvasEvent({ x: 0, y: 0 }), connection, 1, true);

        dragging.hover({
          element: connection,
          gfx: canvas.getGraphics(connection)
        });

        dragging.move(canvasEvent({ x: 260, y: 200 }));

        dragging.end();

        // then
        expect(Math.round(connection.label.x)).to.be.within(240, 242);
        expect(Math.round(connection.label.y)).to.be.equal(148);


      }));


      it('remove bendpoint when label on bendpoint', inject(function(elementRegistry, bendpointMove, dragging, modeling) {

        // given
        var connection = elementRegistry.get('SequenceFlow_C');

        // label out of segments, on a bendpoint
        modeling.moveShape(connection.label, { x: 40, y: 0 });

        // when
        bendpointMove.start(canvasEvent({ x: 0, y: 0 }), connection, 1);

        dragging.move(canvasEvent({ x: 455, y: 320 }));

        dragging.end();

        // then
        expect(Math.round(connection.label.x)).to.be.within(462, 465);
        expect(Math.round(connection.label.y)).to.be.within(290, 293);

      }));


      it('add benpoint, label on segment, should not move', inject(function(elementRegistry, bendpointMove, canvas, dragging, modeling) {

        // given
        var connection = elementRegistry.get('SequenceFlow_C');

        // label out of segments, on a bendpoint
        modeling.moveShape(connection.label, { x: 40, y: -60 });
        var position = getLabelPosition(connection);

        // when
        bendpointMove.start(canvasEvent({ x: 0, y: 0 }), connection, 2, true);

        dragging.hover({
          element: connection,
          gfx: canvas.getGraphics(connection)
        });

        dragging.move(canvasEvent({ x: 400, y: 350 }));

        dragging.end();

        // then
        expectLabelMoved(connection, position, { x: 0, y: 0 });

      }));

    });


    describe('special cases', function() {

      it('should behave properly, right after importing', inject(function(elementRegistry, connectionSegmentMove, dragging, modeling) {

        // given
        var connection = elementRegistry.get('SequenceFlow_C'),
            labelPosition = getLabelPosition(connection),
            label = connection.label;

        // when
        connectionSegmentMove.start(canvasEvent({ x: 0, y: 0 }), connection, 2);

        dragging.move(canvasEvent({ x: 0, y: 70 }));

        dragging.end();

        // move label
        modeling.moveShape(label, { x: 40, y: -30 });

        // drag again
        connectionSegmentMove.start(canvasEvent({ x: 0, y: 0 }), connection, 1);

        dragging.move(canvasEvent({ x: -20, y: 0 }));

        dragging.end();

        // then
        expectLabelMoved(connection, labelPosition, { x: 20, y: 40 });

      }));


      it('should reposition on right segment', inject(function(elementRegistry, connectionSegmentMove, dragging) {

        // given
        var connection = elementRegistry.get('SequenceFlow_E'),
            labelPosition = getLabelPosition(connection);

        // when
        connectionSegmentMove.start(canvasEvent({ x: 0, y: 0 }), connection, 2);

        dragging.move(canvasEvent({ x: -100, y: 0 }));

        dragging.end();

        // then
        expect(connection.label.y - labelPosition.y).to.be.within(-76, -70);
        expect(connection.label.x - labelPosition.x).to.be.within(-54, -51);

      }));


      describe.skip('label out of bounds', function() {

        it('should not move label that is out of bounds', inject(function(elementRegistry, connectionSegmentMove, dragging, modeling) {

          // given
          var connection = elementRegistry.get('SequenceFlow_C');

          // move shape away
          modeling.moveShape(connection.label, { x: 0, y: 140 });

          var labelPosition = getLabelPosition(connection);

          // when
          connectionSegmentMove.start(canvasEvent({ x: 0, y: 0 }), connection, 2);

          dragging.move(canvasEvent({ x: 0, y: 30 }));

          dragging.end();

          // then
          expectLabelMoved(connection, labelPosition, { x: 0, y: 0 });
        }));


        it('should not move label that is out of bounds in corner', inject(function(elementRegistry, connectionSegmentMove, dragging, modeling) {

          // given
          var connection = elementRegistry.get('SequenceFlow_C');

          // move shape away
          modeling.moveShape(connection.label, { x: 50, y: 0 });

          var labelPosition = getLabelPosition(connection);

          // when
          connectionSegmentMove.start(canvasEvent({ x: 0, y: 0 }), connection, 2);

          dragging.move(canvasEvent({ x: 0, y: 30 }));

          dragging.end();

          // then
          expectLabelMoved(connection, labelPosition, { x: 0, y: 0 });
        }));

      });

    });

  });


  describe('integration', function() {

    describe('space tool', function() {

      var diagramXML = require('./LabelLayouting.special.bpmn');

      beforeEach(bootstrapModeler(diagramXML, {
        modules: testModules
      }));

      beforeEach(inject(function(dragging) {
        dragging.setOptions({ manual: true });
      }));


      it('should move with a skewed line', inject(function(elementRegistry, spaceTool, dragging) {

        // given
        var connection = elementRegistry.get('SequenceFlow_1'),
            labelPosition = getLabelPosition(connection);

        // when
        spaceTool.activateMakeSpace(canvasEvent({ x: 500, y: 225 }));

        dragging.move(canvasEvent({ x: 550, y: 225 }));
        dragging.end();

        // then
        expectLabelMoved(connection, labelPosition, { x: 25, y: 0 });
      }));

    });

  });

});



function getLabelPosition(connection) {

  var label = connection.label;

  var mid = {
    x: label.x + (label.width / 2),
    y: label.y + (label.height / 2)
  };

  return mid;
}


function expectLabelMoved(connection, oldPosition, expectedDelta) {

  var newPosition = getLabelPosition(connection);

  var delta = {
    x: Math.round(newPosition.x - oldPosition.x),
    y: Math.round(newPosition.y - oldPosition.y)
  };

  expect(delta).to.eql(expectedDelta);
}
