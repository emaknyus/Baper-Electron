const effects = {
	saveCurrentEditor: (action, state, send) => {
		const editor = state.editors.find(editor => editor.active)
		if(editor.filePath && editor.filePath !== null) {
			fs.writeFile(editor.filePath, editor.BlankUp.getMarkdown(), (err) => {
				if(err) {
					//TODO Error handling
					return
				}
				send('setEditorUnchanged', editor.id, () => {})
			})
		} else {

			//Tell main process that we need a new filePath.
			ipc.send('saveDialog')
		}
	},
	addEditor: (data, state, send) => {

		//Only open each file once.
		if(data.filePath) {
			if(state.editors.some(editor => editor.filePath === data.filePath)) {

				//Set the editor containing the file active.
				const id = state.editors.find(editor => editor.filePath === data.filePath)
				send('activateEditor', id, () => {})
				return
			}
		}

		//Create a new editor and focus it.
		const newEditor = createNewEditor({
			name: data.name,
			filePath: data.filePath,
			markdown: data.markdown
		})
		send('saveEditor', newEditor, () => {})
		send('activateEditor', newEditor.id, () => {})
	},
	activateEditor: (id, state, send) => {
		send('setEditorActive', id, () => {})

		//Now change the displayed editor outside of Choo.
		const BlankUp = state.editors.find(editor => editor.id === id)
		const container = document.querySelector('#editorContianer')
		container.innerHTML = ''
		container.appendChild(BlankUp.editor)
		const textarea = container.querySelector('textarea')
		textarea.focus()
	},
	closeEditor: (id, state, send) => {

		//Check if there are more editors.
		if(state.editors.length > 1) {

			//Set the one before the current one active if there are more.
			let editorIndex = 0
			state.editors.forEach((editor, index) => {
				if(editor.id === id) {
					editorIndex = index
				}
			})
			const index = editorIndex === 0 ? 1 : editorIndex - 1
			send('activateEditor', state.editors[index].id, () => {})
		} else {

			//If this is the last editor make sure to clear the editorContainer.
			document.querySelector('#editorContianer').innerHTML = ''
		}

		//Do this last so all prior operations can use the old indexes.
		send('removeEditor', id, () => {})
	},
	closeCurrentEditor: (data, state, send) => {
		const currentId = state.editors.find(editor => editor.active === true).id
		send('closeEditor', currentId, () => {})
	}
}

module.exports = effects
