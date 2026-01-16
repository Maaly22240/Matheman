import React, { useState, useEffect } from 'react';
import axios from 'axios';
// Tiptap imports
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image'; // Import image extension
// Styling imports
import '../../styles/TeacherDashboard.css'; 
import '../../styles/TiptapEditor.css'; // Add specific Tiptap styles

// Basic Tiptap Toolbar component (can be expanded)
const MenuBar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="tiptap-menubar">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''}>
        Bold
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''}>
        Italic
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'is-active' : ''}>
        Strike
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}>
        H2
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}>
        H3
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''}>
        Bullet list
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'is-active' : ''}>
        Ordered list
      </button>
      {/* Add Image Button - Basic URL prompt */}
      <button
        type="button"
        onClick={() => {
          const url = window.prompt('Enter image URL');
          if (url) {
            editor.chain().focus().setImage({ src: url }).run();
          }
        }}
      >
        Image
      </button>
    </div>
  );
};

const MnemonicForm = ({ initialData, onSubmitSuccess, onCancel }) => {
    const [title, setTitle] = useState('');
    // Tiptap editor state is handled by the hook
    const [relatedChapter, setRelatedChapter] = useState('');
    const [relatedDomain, setRelatedDomain] = useState('');
    const [tags, setTags] = useState('');
    const [students, setStudents] = useState([]); 
    const [assignedStudentIds, setAssignedStudentIds] = useState([]); 
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // Initialize Tiptap Editor
    const editor = useEditor({
        extensions: [
            StarterKit, // Basic text formatting, lists, etc.
            Image,      // Add image support
        ],
        content: '', // Initial content
        onUpdate: ({ editor }) => {
            // Optionally trigger validation or other actions on update
        },
    });

    // Populate form & editor content
    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title || '');
            // Set editor content *after* editor is initialized
            if (editor) {
                editor.commands.setContent(initialData.content || '');
            }
            setRelatedChapter(initialData.relatedChapter?._id || '');
            setRelatedDomain(initialData.relatedDomain?._id || '');
            setTags((initialData.tags || []).join(', '));
            setAssignedStudentIds(initialData.assignedStudents?.map(s => s._id) || []);
        } else {
             // Clear editor for new form
             if (editor) {
                 editor.commands.setContent('');
             }
        }
    }, [initialData, editor]);

    // Fetch available students for assignment
    useEffect(() => {
        const fetchStudentsForAssignment = async () => {
            setLoadingStudents(true);
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const response = await axios.get('http://localhost:5000/api/users/students', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStudents(response.data || []);
            } catch (err) {
                console.error("Error fetching students for assignment:", err);
                // Handle error appropriately
            } finally {
                setLoadingStudents(false);
            }
        };
        fetchStudentsForAssignment();
    }, []);

    const handleStudentSelectionChange = (event) => {
        const selectedOptions = Array.from(event.target.selectedOptions, option => option.value);
        setAssignedStudentIds(selectedOptions);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const token = localStorage.getItem('token');
        if (!token || !editor) {
            setError('Authentication or editor initialization error.');
            setLoading(false);
            return;
        }

        // Get HTML content from Tiptap
        const htmlContent = editor.getHTML();

        const mnemonicData = {
            title,
            content: htmlContent, // Use HTML content from editor
            relatedChapter: relatedChapter || null,
            relatedDomain: relatedDomain || null,
            tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
            assignedStudents: assignedStudentIds, 
        };

        try {
            let response;
            if (initialData?._id) {
                response = await axios.put(`http://localhost:5000/api/mnemonics/${initialData._id}`, mnemonicData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            } else {
                response = await axios.post('http://localhost:5000/api/mnemonics', mnemonicData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }
            onSubmitSuccess(response.data);
        } catch (err) {
            console.error("Error saving mnemonic:", err);
            setError(err.response?.data?.message || 'Failed to save mnemonic. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Cleanup editor instance on component unmount
    useEffect(() => {
        return () => {
            editor?.destroy();
        };
    }, [editor]);

    return (
        <div className="mnemonic-form-container">
            <h3>{initialData ? 'Edit Mnemonic' : 'Create New Mnemonic'}</h3>
            <form onSubmit={handleSubmit}>
                {error && <p className="error-message">{error}</p>}
                <div className="form-group">
                    <label htmlFor="mnemonic-title">Title *</label>
                    <input 
                        type="text" 
                        id="mnemonic-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required 
                    />
                </div>
                <div className="form-group">
                    <label>Content *</label>
                    <div className="tiptap-editor-wrapper">
                        <MenuBar editor={editor} />
                        <EditorContent editor={editor} />
                    </div>
                </div>
                <div className="form-group">
                    <label htmlFor="mnemonic-tags">Tags (comma-separated)</label>
                    <input 
                        type="text" 
                        id="mnemonic-tags"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="assign-students">Assign to Students (Ctrl/Cmd + Click for multiple)</label>
                    <select 
                        multiple 
                        id="assign-students"
                        value={assignedStudentIds} 
                        onChange={handleStudentSelectionChange}
                        className="student-select-list"
                        disabled={loadingStudents}
                        size="5" // Show a few students at once
                    >
                        {loadingStudents ? (
                            <option disabled>Loading students...</option>
                        ) : (
                            students.map(student => (
                                <option key={student._id} value={student._id}>
                                    {student.name} ({student.email})
                                </option>
                            ))
                        )}
                    </select>
                </div>
                <div className="form-actions">
                    <button type="button" className="secondary-btn" onClick={onCancel} disabled={loading}>
                        Cancel
                    </button>
                    <button type="submit" className="primary-btn" disabled={loading}>
                        {loading ? 'Saving...' : (initialData ? 'Update Mnemonic' : 'Create Mnemonic')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MnemonicForm;