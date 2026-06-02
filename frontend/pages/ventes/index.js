"""
Page de gestion des ventes
"""
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { Card, Button, Input, Select, Modal, Table, Statistic, Row, Col, message, Form, Space, Tag, Popconfirm, InputNumber, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import Layout from '../../components/Layout';

const { Option } = Select;
const { Column } = Table;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const VentesPage = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingVente, setEditingVente] = useState(null);
  const [filters, setFilters] = useState({ statut: null, client: null });
  const queryClient = useQueryClient();

  // Récupérer les ventes
  const { data: ventes = [], isLoading } = useQuery('ventes', async () => {
    const res = await axios.get('/api/ventes');
    return res.data;
  });

  // Récupérer les clients
  const { data: clients = [] } = useQuery('clients', async () => {
    const res = await axios.get('/api/ventes/clients');
    return res.data;
  });

  // Récupérer les produits
  const { data: produits = [] } = useQuery('produits', async () => {
    const res = await axios.get('/api/ventes/produits');
    return res.data;
  });

  // Créer ou mettre à jour une vente
  const mutation = useMutation(
    async (data) => {
      if (editingVente) {
        return axios.put(`/api/ventes/${editingVente.id}`, data);
      }
      return axios.post('/api/ventes', data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ventes');
        setIsModalVisible(false);
        setEditingVente(null);
        form.resetFields();
        message.success(editingVente ? 'Vente mise à jour' : 'Vente créée');
      },
      onError: (err) => {
        message.error(err.response?.data?.detail || 'Erreur lors de la sauvegarde');
      }
    }
  );

  // Supprimer une vente
  const deleteMutation = useMutation(
    async (id) => axios.delete(`/api/ventes/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ventes');
        message.success('Vente supprimée');
      },
      onError: (err) => {
        message.error(err.response?.data?.detail || 'Erreur lors de la suppression');
      }
    }
  );

  const showModal = (vente = null) => {
    setEditingVente(vente);
    if (vente) {
      form.setFieldsValue({
        client_id: vente.client_id,
        reference: vente.reference,
        statut: vente.statut,
        total_ht: vente.total_ht,
        total_tva: vente.total_tva,
        total_ttc: vente.total_ttc,
        observations: vente.observations
      });
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form.validateFields().then((values) => {
      mutation.mutate(values);
    });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingVente(null);
    form.resetFields();
  };

  const statutColors = {
    devis: 'gray',
    commande: 'blue',
    livree: 'green',
    facturee: 'purple',
    payee: 'gold',
    annulee: 'red'
  };

  const filteredVentes = ventes.filter(v => {
    if (filters.statut && v.statut !== filters.statut) return false;
    if (filters.client && v.client_id !== filters.client) return false;
    return true;
  });

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gestion des Ventes</h1>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
            Ajouter une Vente
          </Button>
        </div>

        {/* Statistiques */}
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card>
              <Statistic 
                title="Total Ventes" 
                value={ventes.length} 
                prefix={<ShoppingCartOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="CA Total" 
                value={`€${ventes.reduce((sum, v) => sum + (v.total_ttc || 0), 0).toFixed(2)}`} 
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="En Cours" 
                value={ventes.filter(v => ['devis', 'commande'].includes(v.statut)).length} 
                prefix={<Tag color="blue">C</Tag>}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Payées" 
                value={ventes.filter(v => v.statut === 'payee').length} 
                prefix={<Tag color="gold">€</Tag>}
              />
            </Card>
          </Col>
        </Row>

        {/* Filtres */}
        <Card className="mb-6">
          <div className="flex gap-4">
            <Select 
              placeholder="Filtrer par statut" 
              style={{ width: 200 }} 
              onChange={(val) => setFilters({...filters, statut: val})}
              allowClear
            >
              <Option value="devis">Devis</Option>
              <Option value="commande">Commande</Option>
              <Option value="livree">Livrée</Option>
              <Option value="facturee">Facturée</Option>
              <Option value="payee">Payée</Option>
              <Option value="annulee">Annulée</Option>
            </Select>
            <Select 
              placeholder="Filtrer par client" 
              style={{ width: 200 }} 
              onChange={(val) => setFilters({...filters, client: val})}
              allowClear
            >
              {clients.map(c => (
                <Option key={c.id} value={c.id}>{c.nom} {c.prenom}</Option>
              ))}
            </Select>
            <Button icon={<SearchOutlined />} type="primary">
              Rechercher
            </Button>
          </div>
        </Card>

        {/* Tableau des ventes */}
        <Card>
          <Table 
            dataSource={filteredVentes} 
            loading={isLoading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          >
            <Column title="Référence" dataIndex="reference" key="reference" />
            <Column title="Client" dataIndex="client_nom" key="client_nom" />
            <Column title="Date" dataIndex="date_vente" key="date_vente" />
            <Column title="Total HT" dataIndex="total_ht" key="total_ht" render={(val) => `€${val || 0}`} />
            <Column title="Total TTC" dataIndex="total_ttc" key="total_ttc" render={(val) => `€${val || 0}`} />
            <Column 
              title="Statut" 
              dataIndex="statut" 
              key="statut" 
              render={(statut) => (
                <Tag color={statutColors[statut] || 'default'}>
                  {statut}
                </Tag>
              )}
            />
            <Column 
              title="Actions" 
              key="actions" 
              render={(_, record) => (
                <Space>
                  <Button 
                    icon={<EyeOutlined />} 
                    onClick={() => showModal(record)}
                    size="small"
                  />
                  <Button 
                    icon={<EditOutlined />} 
                    onClick={() => showModal(record)}
                    size="small"
                    type="link"
                  />
                  <Popconfirm
                    title="Êtes-vous sûr de vouloir supprimer cette vente ?"
                    onConfirm={() => deleteMutation.mutate(record.id)}
                    okText="Oui"
                    cancelText="Non"
                  >
                    <Button icon={<DeleteOutlined />} size="small" danger type="link" />
                  </Popconfirm>
                </Space>
              )}
            />
          </Table>
        </Card>

        {/* Modal */}
        <Modal 
          title={editingVente ? 'Modifier Vente' : 'Ajouter Vente'} 
          open={isModalVisible} 
          onOk={handleOk} 
          onCancel={handleCancel}
          confirmLoading={mutation.isLoading}
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item name="client_id" label="Client" rules={[{ required: true, message: 'Veuillez sélectionner un client' }]}>
              <Select placeholder="Sélectionnez un client">
                {clients.map(c => (
                  <Option key={c.id} value={c.id}>{c.nom} {c.prenom}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="reference" label="Référence">
              <Input placeholder="Numéro de facture ou devis" />
            </Form.Item>
            <Form.Item name="statut" label="Statut">
              <Select placeholder="Sélectionnez un statut">
                <Option value="devis">Devis</Option>
                <Option value="commande">Commande</Option>
                <Option value="livree">Livrée</Option>
                <Option value="facturee">Facturée</Option>
                <Option value="payee">Payée</Option>
                <Option value="annulee">Annulée</Option>
              </Select>
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="total_ht" label="Total HT (€)">
                  <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="total_tva" label="Total TVA (€)">
                  <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="total_ttc" label="Total TTC (€)">
              <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
            </Form.Item>
            <Form.Item name="observations" label="Observations">
              <TextArea rows={3} placeholder="Observations" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Layout>
  );
};

export default VentesPage;
