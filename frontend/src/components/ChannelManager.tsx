import { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

interface Channel {
    id: number;
    name: string;
    last_updated: string | null;
    group_id?: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const ChannelManager = () => {
    const { t } = useTranslation();
    const [channels, setChannels] = useState<Channel[]>([]);
    const [newChannel, setNewChannel] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchChannels = async () => {
        try {
            const response = await axios.get(`${API_URL}/channels`);
            setChannels(response.data);
        } catch (error) {
            console.error('Error fetching channels:', error);
        }
    };

    useEffect(() => {
        fetchChannels();
    }, []);

    const handleAddChannel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newChannel) return;
        setLoading(true);
        try {
            await axios.post(`${API_URL}/channels`, { name: newChannel });
            setNewChannel('');
            fetchChannels();
        } catch (error) {
            console.error('Error adding channel:', error);
            alert(t('channels.addError'));
        } finally {
            setLoading(false);
        }
    };

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');

    const handleDelete = async (id: number) => {
        if (!confirm(t('channels.deleteConfirm'))) return;
        try {
            await axios.delete(`${API_URL}/channels/${id}`);
            fetchChannels();
        } catch (error) {
            console.error('Error deleting channel:', error);
            alert(t('channels.deleteError'));
        }
    };

    const [groups, setGroups] = useState<{ id: number; name: string }[]>([]);
    const [newGroup, setNewGroup] = useState('');
    const [editGroupId, setEditGroupId] = useState<number | null>(null);

    const fetchGroups = async () => {
        try {
            const response = await axios.get(`${API_URL}/groups`);
            setGroups(response.data);
        } catch (error) {
            console.error('Error fetching groups:', error);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const handleAddGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroup) return;
        try {
            await axios.post(`${API_URL}/groups`, { name: newGroup });
            setNewGroup('');
            fetchGroups();
        } catch (error) {
            console.error('Error adding group:', error);
            alert(t('groups.addError'));
        }
    };

    const handleDeleteGroup = async (id: number) => {
        if (!confirm(t('groups.deleteConfirm'))) return;
        try {
            await axios.delete(`${API_URL}/groups/${id}`);
            fetchGroups();
            fetchChannels(); // Update channels as their group might have changed
        } catch (error) {
            console.error('Error deleting group:', error);
            alert(t('groups.deleteError'));
        }
    };

    const handleUpdate = async (id: number) => {
        try {
            await axios.put(`${API_URL}/channels/${id}`, {
                name: editName,
                group_id: editGroupId
            });
            setEditingId(null);
            fetchChannels();
        } catch (error) {
            console.error('Error updating channel:', error);
            alert(t('channels.updateError'));
        }
    };

    const startEdit = (channel: Channel) => {
        setEditingId(channel.id);
        setEditName(channel.name);
        setEditGroupId(channel.group_id || null);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName('');
        setEditGroupId(null);
    };

    return (
        <div className="row">
            <div className="col-md-6">
                <div className="card mb-4">
                    <div className="card-header">{t('groups.manage')}</div>
                    <div className="card-body">
                        <form onSubmit={handleAddGroup} className="d-flex gap-2 mb-3">
                            <input
                                type="text"
                                className="form-control"
                                placeholder={t('groups.placeholder')}
                                value={newGroup}
                                onChange={(e) => setNewGroup(e.target.value)}
                            />
                            <button type="submit" className="btn btn-secondary">{t('groups.add')}</button>
                        </form>
                        <ul className="list-group">
                            {groups.map(group => (
                                <li key={group.id} className="list-group-item d-flex justify-content-between align-items-center">
                                    {group.name}
                                    <button className="btn btn-outline-danger btn-sm" onClick={() => handleDeleteGroup(group.id)}>{t('common.delete')}</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            <div className="col-md-6">
                <div className="card mb-4">
                    <div className="card-header">
                        {t('channels.manage')}
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleAddChannel} className="d-flex gap-2 mb-3">
                            <input
                                type="text"
                                className="form-control"
                                placeholder={t('channels.placeholder')}
                                value={newChannel}
                                onChange={(e) => setNewChannel(e.target.value)}
                                disabled={loading}
                            />
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? t('common.adding') : t('common.add')}
                            </button>
                        </form>
                        <ul className="list-group">
                            {channels.map((channel) => (
                                <li key={channel.id} className="list-group-item d-flex justify-content-between align-items-center">
                                    {editingId === channel.id ? (
                                        <div className="d-flex flex-column gap-2 w-100">
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                            />
                                            <select
                                                className="form-select"
                                                value={editGroupId || ''}
                                                onChange={(e) => setEditGroupId(e.target.value ? Number(e.target.value) : null)}
                                            >
                                                <option value="">{t('groups.none')}</option>
                                                {groups.map(g => (
                                                    <option key={g.id} value={g.id}>{g.name}</option>
                                                ))}
                                            </select>
                                            <div className="d-flex gap-2">
                                                <button className="btn btn-success btn-sm" onClick={() => handleUpdate(channel.id)}>{t('common.save')}</button>
                                                <button className="btn btn-secondary btn-sm" onClick={cancelEdit}>{t('common.cancel')}</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div>
                                                <span className="fw-bold">{channel.name}</span>
                                                {channel.group_id && (
                                                    <span className="badge bg-secondary ms-2">
                                                        {groups.find(g => g.id === channel.group_id)?.name}
                                                    </span>
                                                )}
                                                <br />
                                                <small className="text-muted">
                                                    {channel.last_updated ? new Date(channel.last_updated).toLocaleString() : t('channels.neverUpdated')}
                                                </small>
                                            </div>
                                            <div className="btn-group">
                                                <button className="btn btn-outline-secondary btn-sm" onClick={() => startEdit(channel)}>{t('common.edit')}</button>
                                                <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(channel.id)}>{t('common.delete')}</button>
                                            </div>
                                        </>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
