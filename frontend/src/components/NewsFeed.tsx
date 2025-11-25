import { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

interface NewsItem {
    id: number;
    channel_name: string;
    content: string;
    image_url?: string;
    date: string;
    message_id: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const NewsFeed = () => {
    const { t } = useTranslation();
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [groups, setGroups] = useState<{ id: number; name: string }[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

    const fetchGroups = async () => {
        try {
            const response = await axios.get(`${API_URL}/groups`);
            setGroups(response.data);
        } catch (error) {
            console.error('Error fetching groups:', error);
        }
    };

    const [cleanupBeforeRefresh, setCleanupBeforeRefresh] = useState(false);

    const fetchNews = async () => {
        setLoading(true);
        try {
            if (cleanupBeforeRefresh) {
                await axios.post(`${API_URL}/news/cleanup`);
            }
            const url = selectedGroupId
                ? `${API_URL}/news?group_id=${selectedGroupId}`
                : `${API_URL}/news`;
            const response = await axios.get(url);
            // Ensure sorting by date descending
            const sortedNews = response.data.sort((a: NewsItem, b: NewsItem) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            setNews(sortedNews);
        } catch (error) {
            console.error('Error fetching news:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    useEffect(() => {
        fetchNews();
        const interval = setInterval(fetchNews, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, [selectedGroupId]);

    return (
        <div className="container">
            {loading && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', zIndex: 2000 }}
                >
                    <div className="d-flex flex-column align-items-center">
                        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <div className="mt-2 fw-bold text-primary">{t('common.refreshing')}</div>
                    </div>
                </div>
            )}
            <div className="sticky-top bg-light pt-3 pb-2 mb-3" style={{ zIndex: 1000 }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2>{t('news.title')}</h2>
                    <div className="d-flex gap-2 align-items-center">
                        <div className="form-check me-2">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="cleanupCheck"
                                checked={cleanupBeforeRefresh}
                                onChange={(e) => setCleanupBeforeRefresh(e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor="cleanupCheck">
                                Cleanup before refresh
                            </label>
                        </div>
                        <button
                            className="btn btn-outline-primary"
                            onClick={fetchNews}
                            disabled={loading}
                        >
                            {t('common.refresh')}
                        </button>
                    </div>
                </div>

                <div className="d-flex gap-2 overflow-auto pb-2">
                    <button
                        className={`btn ${selectedGroupId === null ? 'btn-primary' : 'btn-outline-primary'} text-nowrap`}
                        onClick={() => setSelectedGroupId(null)}
                    >
                        {t('groups.all')}
                    </button>
                    {groups.map(g => (
                        <button
                            key={g.id}
                            className={`btn ${selectedGroupId === g.id ? 'btn-primary' : 'btn-outline-primary'} text-nowrap`}
                            onClick={() => setSelectedGroupId(g.id)}
                        >
                            {g.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="row">
                {news.map((item) => (
                    <div key={item.id} className="col-12 mb-3">
                        <div className="card">
                            <div className="card-header d-flex justify-content-between">
                                <strong>{item.channel_name}</strong>
                                <small className="text-muted">{new Date(item.date).toLocaleString()}</small>
                            </div>
                            <div className="card-body">
                                {item.image_url && (
                                    <img
                                        src={`${API_URL}${item.image_url}`}
                                        alt="News content"
                                        className="img-fluid mb-3 rounded"
                                        style={{ maxHeight: '400px', objectFit: 'contain' }}
                                    />
                                )}
                                <p className="card-text" style={{ whiteSpace: 'pre-wrap' }}>{item.content}</p>
                            </div>
                        </div>
                    </div>
                ))}
                {news.length === 0 && !loading && (
                    <div className="col-12 text-center text-muted">
                        {t('news.notFound')}
                    </div>
                )}
            </div>
        </div>
    );
};
