import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './Resources.module.css';

interface Resource {
    id: number;
    title: string;
    description: string;
    type: string;
    url: string;
    icon: string;
}

export default function Resources(): JSX.Element {
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchResources = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('/api/resources', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data && response.data.success) {
                    setResources(response.data.resources);
                } else {
                    setError('Failed to load resources.');
                }
            } catch (err) {
                console.error('Error fetching resources:', err);
                setError('Could not connect to the server.');
            } finally {
                setLoading(false);
            }
        };

        fetchResources();
    }, []);

    return (
        <main className={styles['main-content']}>
            <div className={styles['header']}>
                <h1>Relationship Resources</h1>
                <p>Curated articles, videos, and worksheets to strengthen your bond.</p>
            </div>

            {loading ? (
                <div className={styles['loading']}>Loading resources...</div>
            ) : error ? (
                <div className={styles['error']}>{error}</div>
            ) : (
                <div className={styles['resources-grid']}>
                    {resources.map((res) => (
                        <a key={res.id} href={res.url} target="_blank" rel="noopener noreferrer" className={styles['resource-card']}>
                            <div className={styles['icon-container']}>
                                <i className={res.icon || 'fas fa-book'}></i>
                            </div>
                            <div className={styles['content']}>
                                <div className={styles['badge']}>{res.type.toUpperCase()}</div>
                                <h3>{res.title}</h3>
                                <p>{res.description}</p>
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </main>
    );
}
