import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './AdminResources.module.css';

export default function AdminResources() {
    const [resources, setResources] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('article');
    const [url, setUrl] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchResources = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:3000/api/resources', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                // Map the backend 'type' to frontend 'category'
                const mappedResources = res.data.resources.map((r: any) => ({
                    ...r,
                    category: r.type,
                    date: r.created_at ? r.created_at.split(' ')[0].split('T')[0] : new Date().toISOString().split('T')[0]
                }));
                setResources(mappedResources);
            }
        } catch (error) {
            console.error("Failed to fetch resources", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResources();
    }, []);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title) return alert('Please enter a title');

        // Strict logic check: System will not accept if admin uploads a PDF AND pastes a URL
        if (file && url) return alert('System Error: You cannot upload a PDF file and paste a URL link at the same time. Please provide only one.');
        if (!file && !url) return alert('Please provide either a PDF file or a URL link.');

        setUploading(true);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('category', category);
            if (file) {
                formData.append('file', file);
            } else {
                formData.append('url', url);
            }

            const response = await axios.post('http://localhost:3000/api/admin/resources', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                alert('Resource uploaded successfully!');
                setTitle('');
                setDescription('');
                setUrl('');
                setFile(null);
                fetchResources(); // Refresh the list
            }
        } catch (error: any) {
            console.error("Failed to upload resource", error);
            alert(error.response?.data?.error || 'Failed to upload resource');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this resource?')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`http://localhost:3000/api/admin/resources/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setResources(resources.filter(r => r.id !== id));
            } catch (error) {
                console.error("Failed to delete resource", error);
                alert("Failed to delete resource");
            }
        }
    };

    const filteredResources = resources.filter(r =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <main className={styles['main-content']}>
            <div className={styles['dashboard-header']}>
                <h1>Resource Management</h1>
            </div>

            <div className={styles['stats-grid']}>
                <div className={`${styles['stat-card']} ${styles['upload-card']}`}>
                    <div className={styles['card-header-row']}>
                        <div className={styles['card-title']}>Upload New Resource</div>
                        <i className={`fas fa-cloud-upload-alt ${styles.iconSage}`}></i>
                    </div>

                    <form onSubmit={handleUpload} className={styles['form-container']}>
                        <div className={styles['form-row']}>
                            <div className={styles['form-group']}>
                                <label className={styles['form-label']}>Resource Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Couples Therapy Workbook"
                                    className={styles['form-input']}
                                />
                            </div>
                            <div className={styles['form-group']}>
                                <label className={styles['form-label']}>Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className={styles['form-select']}
                                >
                                    <option value="article">Article / Guide</option>
                                    <option value="pdf">PDF Document</option>
                                    <option value="video">Video Link</option>
                                </select>
                            </div>
                        </div>

                        <div className={styles['form-group']}>
                            <label className={styles['form-label']}>Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Brief description of the resource..."
                                className={`${styles['form-input']} ${styles.resizeVertical}`}
                                rows={2}
                            />
                        </div>

                        <div className={styles['form-row']}>
                            <label className={styles['form-label']}>Resource Source (URL)</label>
                            <div className={styles.flexRowCenter}>
                                <input
                                    type="text"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://..."
                                    className={`${styles['form-input']} ${styles.flex1}`}
                                />
                                <span className={styles.orText}>OR</span>
                                <label className={`${styles['action-btn']} ${styles.uploadLabel} ${file ? styles.uploadLabelActive : ''}`}>
                                    <i className={`fas fa-file-pdf ${styles.pdfIcon} ${file ? styles.pdfIconActive : ''}`}></i>
                                    {file ? file.name : 'Upload PDF'}
                                    <input
                                        type="file"
                                        accept=".pdf,application/pdf"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setFile(e.target.files[0]);
                                            }
                                        }}
                                        className={styles.hiddenInput}
                                    />
                                </label>
                                {file && (
                                    <button
                                        type="button"
                                        onClick={() => setFile(null)}
                                        className={styles.removeFileBtn}
                                        title="Remove File"
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className={styles['form-actions']}>
                            <button
                                type="submit"
                                disabled={uploading}
                                className={styles['submit-btn']}
                            >
                                {uploading ? 'Uploading...' : 'Publish Resource'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className={`${styles['section-header']} ${styles['resources-header']}`}>
                <span>Available Resources</span>
                <div className={styles['search-container']}>
                    <i className={`fas fa-search ${styles.searchIcon}`}></i>
                    <input
                        type="text"
                        placeholder="Search resources..."
                        className={styles['search-input']}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className={styles['table-container']}>
                {loading ? (
                    <div className={styles['center-text']}>Loading resources...</div>
                ) : (
                    <table className={styles['data-table']}>
                        <thead>
                            <tr>
                                <th className={styles.colTitle}>Title</th>
                                <th className={styles.colDesc}>Description</th>
                                <th className={styles.colCat}>Category</th>
                                <th className={styles.colDate}>Date Uploaded</th>
                                <th className={styles.colActions}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredResources.map(resource => (
                                <tr key={resource.id}>
                                    <td>
                                        <strong>{resource.title}</strong>
                                    </td>
                                    <td>
                                        <div className={styles.descText} title={resource.description}>
                                            {resource.description || <span className={styles.noDescText}>No description</span>}
                                        </div>
                                    </td>
                                    <td className={styles['category-cell']}>
                                        <span className={styles['category-pill']}>
                                            {resource.category}
                                        </span>
                                    </td>
                                    <td>{resource.date}</td>
                                    <td>
                                        <button
                                            className={`${styles['action-btn']} ${styles['delete-btn']}`}
                                            onClick={() => handleDelete(resource.id)}
                                        >
                                            Delete
                                        </button>
                                        <button
                                            className={styles['action-btn']}
                                            onClick={() => {
                                                if (resource.url && resource.url !== '#') {
                                                    window.open(resource.url, '_blank');
                                                } else {
                                                    alert('No URL available for this resource.');
                                                }
                                            }}
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredResources.length === 0 && (
                                <tr>
                                    <td colSpan={5} className={styles['center-text']}>No resources found matching "{searchQuery}".</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </main>
    );
}
