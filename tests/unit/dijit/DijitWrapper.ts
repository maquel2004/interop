import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import harness from '@dojo/test-extras/harness';
import { stub } from 'sinon';
import DijitWrapper from '../../../src/dijit/DijitWrapper';

import { v, w } from '@dojo/widget-core/d';

let lastDestroyPreserveDom: boolean;

class MockDijit {
	public id: string;
	public srcNodeRef: HTMLElement;
	public domNode: HTMLElement;

	constructor(params: Object, srcRefNode?: string | Node) { }

	public destroy(preserveDom = false) {
		lastDestroyPreserveDom = false;
	}

	public placeAt(node: HTMLElement, reference?: string | number) {
		if (reference !== 'replace') {
			throw new Error('Expected "replace" as reference');
		}
		return this;
	}

	public set() {
		return this;
	}

	public startup() { }
}

class ContainerMockDijit extends MockDijit {
	public addChild() { }
}

registerSuite({
	name: 'dijit/DijitWrapper',

	'a wrapped dijit should create an empty vnode'() {
		const widget = harness(DijitWrapper(MockDijit));
		widget.expectRender(v('div', { key: 'root' }, []), 'should have created an empty node');
		widget.destroy();
	},

	'a wrapped dijit with children dijit should render children'() {
		const ContainerDijitWidget = DijitWrapper(ContainerMockDijit);
		const MockDijitWidget = DijitWrapper(MockDijit);
		const widget = harness(ContainerDijitWidget);
		widget.setChildren([
			w(MockDijitWidget, { key: 'foo' }),
			w(MockDijitWidget, { key: 'bar' }),
			w(MockDijitWidget, { key: 'baz' })
		]);

		widget.expectRender(v('div', { key: 'root' }, [
			w(MockDijitWidget, { key: 'foo', onInstantiate: widget.listener } as any),
			w(MockDijitWidget, { key: 'bar', onInstantiate: widget.listener } as any),
			w(MockDijitWidget, { key: 'baz', onInstantiate: widget.listener } as any)
		]));

		const dijit = new MockDijit({});

		widget.callListener('onInstantiate', {
			args: [ dijit ],
			key: 'foo'
		});
		widget.destroy();
		assert.isFalse(lastDestroyPreserveDom, 'wrapper should not preserve Dijit DOM');
	},

	'a wrapped dijit should render supplied key'() {
		const widget = harness(DijitWrapper(MockDijit));
		widget.setProperties({
			key: 'foo'
		});
		widget.expectRender(v('div', { key: 'foo' }, []), 'should have created an empty node');
		widget.destroy();
	},

	'a contained dijit with children should render flat array of its children'() {
		const ContainerDijitWidget = DijitWrapper(ContainerMockDijit);
		const MockDijitWidget = DijitWrapper(MockDijit);
		const widget = harness(ContainerDijitWidget);
		const onInstantiate = stub();
		widget.setProperties({
			onInstantiate
		});
		widget.setChildren([
			w(MockDijitWidget, { key: 'foo' }),
			w(MockDijitWidget, { key: 'bar' }),
			w(MockDijitWidget, { key: 'baz' })
		]);

		widget.expectRender([
			w(MockDijitWidget, { key: 'foo', onInstantiate: widget.listener } as any),
			w(MockDijitWidget, { key: 'bar', onInstantiate: widget.listener } as any),
			w(MockDijitWidget, { key: 'baz', onInstantiate: widget.listener } as any)
		]);
		widget.destroy();
	},

	'a dijit wrapper should use tag name provided when rendering'() {
		const widget = harness(DijitWrapper(MockDijit, 'span'));
		widget.expectRender(v('span', { key: 'root' }, []));
	}
});
