import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import AddInventoryForm from '../../components/staff/AddInventoryForm';
import FaultyDeliveryForm from '../../components/staff/FaultyDeliveryForm';
import { showNotification } from '../../utils/errorHandler';

export default function InventoryLog() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [modalTitle, setModalTitle] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/inventory', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setItems(data.inventory);
      } else {
        showNotification(data.message || 'Failed to fetch inventory', 'error');
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      showNotification('Unable to connect to server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (title, content) => {
    setModalTitle(title);
    setModalContent(content);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalContent(null);
    setModalTitle('');
  };

  const addInventoryItem = () => {
    openModal(
      'Add Inventory Item',
      <AddInventoryForm 
        onAdd={(item) => {
          setItems([item, ...items]);
          showNotification('Inventory item added successfully', 'success');
        }}
        onClose={closeModal}
      />
    );
  };

  const logFaultyDelivery = () => {
    openModal(
      'Log Faulty/Damaged Delivery',
      <FaultyDeliveryForm 
        onSubmit={(report) => {
          showNotification('Faulty delivery logged successfully', 'success');
        }}
        onClose={closeModal}
      />
    );
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px' 
      }}>
        <div style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <div>Loading inventory...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="header">
        <h1>📦 Inventory Management</h1>
        <div className="btn-group">
          <button className="btn btn-primary btn-sm" onClick={addInventoryItem}>
            ➕ Add Item
          </button>
          <button className="btn btn-danger btn-sm" onClick={logFaultyDelivery}>
            ⚠️ Log Faulty Delivery
          </button>
        </div>
      </div>

      <div className="card">
        {items.length === 0 ? (
          <div style={{ 
            padding: '3rem', 
            textAlign: 'center', 
            color: 'var(--text-dim)' 
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
            <p>No inventory items found. Add your first item!</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Date Added</th>
                <th>Added By</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td>{item.item_name}</td>
                  <td>{item.quantity} {item.unit}</td>
                  <td>{new Date(item.created_at).toLocaleDateString()}</td>
                  <td>{item.added_by_name || item.added_by_username}</td>
                  <td>
                    <span className={`badge badge-${
                      item.status === 'approved' ? 'success' : 
                      item.status === 'rejected' ? 'danger' : 
                      'warning'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => alert(`Item: ${item.item_name}\nQuantity: ${item.quantity} ${item.unit}\nStatus: ${item.status}`)}
                    >
                      👁️ View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal 
        isOpen={modalOpen} 
        onClose={closeModal} 
        title={modalTitle}
        size="medium"
      >
        {modalContent}
      </Modal>
    </>
  );
}