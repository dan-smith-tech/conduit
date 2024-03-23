import { Descendant, Editor } from "slate";

import { EditorInterface } from "./slate";
import { EditorOperate } from "./operate";

export const EditorUpdate = {
	// when a user presses a key, while the editor is focused
	onType(e: React.KeyboardEvent, editorState: Editor) {
		switch (e.key) {
			case "Enter": {
				e.preventDefault();

				// get the outer parent node of the current selection
				const containerNode =
					EditorInterface.getSelectedRootNode(editorState);
				if (!containerNode) break;
				const { node: rootNode, index: rootNodeIndex } = containerNode;

				// get index of the cursor within the node
				const { index: cursorOffset, path: cursorPath } =
					EditorInterface.getCursorPosition(editorState);

				// get the (text) content of the current selected node
				let nodeContent = EditorInterface.getNodeContent(rootNode);
				if (EditorInterface.isNodeAList(rootNode)) {
					const indexOfSelectedListItem =
						EditorInterface.getIndexOfCurrentListItem(editorState);
					const selectedListItem = EditorInterface.getNodeAtPosition(
						editorState,
						[rootNodeIndex, indexOfSelectedListItem]
					);
					nodeContent = EditorInterface.getNodeContent(selectedListItem);
				}

				// replace the current node with the content before the cursor
				EditorInterface.insertText(
					editorState,
					nodeContent.slice(0, cursorOffset),
					cursorPath
				);

				// create the default new node and insert it after the current node
				let insertPath = [rootNodeIndex + 1];
				let newItem = EditorInterface.generateNewNode(
					"paragraph",
					"text",
					nodeContent.substring(cursorOffset, nodeContent.length)
				);

				// if a list item with content before the cursor is selected,
				// update the new node to be a new list item
				if (
					EditorInterface.isNodeAList(rootNode) &&
					!!nodeContent.substring(0, cursorOffset)
				) {
					insertPath = [
						rootNodeIndex,
						EditorInterface.getIndexOfCurrentListItem(editorState) + 1,
					];
					newItem = EditorInterface.generateNewNode(
						EditorInterface.getCorrespondingListItemType(rootNode),
						"text",
						nodeContent.substring(cursorOffset, nodeContent.length)
					);
				}
				// if a list item without content is selected, split the list
				else if (EditorInterface.isNodeAList(rootNode) && !nodeContent) {
					EditorOperate.splitList(
						editorState,
						EditorInterface.getNodeAtPosition(editorState, [
							rootNodeIndex,
							EditorInterface.getIndexOfCurrentListItem(editorState),
						])
					);
				}

				// insert the new node and set the cursor to it
				EditorInterface.insertNode(editorState, newItem, insertPath);
				EditorInterface.setCursor(editorState, insertPath);

				break;
			}
		}

		if (e.ctrlKey) {
			switch (e.key) {
				case "b": {
					e.preventDefault();
					EditorOperate.toggleMark(editorState, "bold");
					break;
				}
				case "i": {
					e.preventDefault();
					EditorOperate.toggleMark(editorState, "italic");
					break;
				}
				case "~": {
					e.preventDefault();
					EditorOperate.toggleMark(editorState, "strikethrough");
					break;
				}
				case "`": {
					e.preventDefault();
					EditorOperate.toggleMark(editorState, "code");
					break;
				}
			}
		}
	},
	// when the state of the editor changes, for any reason
	onChange(nodes: Descendant[], editorState: Editor) {
		// check if there are adjacent lists and merge them
		for (let i = 0; i < nodes.length; i++) {
			const currentNodeType = EditorInterface.getNodeType(nodes[i]);
			const nextNodeType = EditorInterface.getNodeType(nodes[i + 1]);

			if (
				EditorInterface.isNodeAList(currentNodeType) &&
				currentNodeType === nextNodeType
			) {
				EditorOperate.mergeLists(
					editorState,
					EditorInterface.getNodeAtPosition(editorState, [i])
				);
				return;
			}
		}
	},
};
