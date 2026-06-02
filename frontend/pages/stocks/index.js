"""
Page de gestion des stocks
"""
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { Card, Button, Input, Select, Modal, Table, Statistic, Row, Col, message, Form, Space, Tag, Popconfirm, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import Layout from '../../components/Layout';

const { Option } = Select;
const { Column } = Table;
const { TextArea } = Input;

const StocksPage = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [filters, setFilters] = useState({ categorie: null, statut: null });
  const queryClient = useQueryClient();

  // Récupérer les stocks
  const { data: stocks = [], isLoading, error } = useQuery('stocks', async () => {
    const res = await axios.get('/api/stocks');
    return res.data;
  });

  // Récupérer les catégories
  const { data: categories = [] } = useQuery('categories_stock', async () => {
    const res = await axios.get('/api/stocks/categories');
    return res.data;
  });

  // Récupérer les fournisseurs
  const { data: fournisseurs = [] } = useQuery('fournisseurs_stock', async () => {
    const res = await axios.get('/api/stocks/fournisseurs');
    return res.data;
  });

  // Créer ou mettre à jour un stock
  const mutation = useMutation(
    async (data) => {
      if (editingStock) {
        return axios.put(`/api/stocks/${editingStock.id}`, data);
      }
      return axios.post('/api/stocks', data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('stocks');
        setIsModalVisible(false);
        setEditingStock(null);
        form.resetFields();
        message.success(editingStock ? 'Stock mis à jour' : 'Stock créé');
      },
      onError: (err) => {
        message.error(err.response?.data?.detail || 'Erreur lors de la sauvegarde');
      }
    }
  );

  // Supprimer un stock
  const deleteMutation = useMutation(
    async (id) => axios.delete(`/api/stocks/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('stocks');
        message.success('Stock supprimé');
      },
      onError: (err) => {
        message.error(err.response?.data?.detail || 'Erreur lors de la suppression');
      }
    }
  );

  const showModal = (stock = null) => {
    setEditingStock(stock);
    if (stock) {
      form.setFieldsValue({
        nom: stock.nom,
        code: stock.code,
        categorie_id: stock.categorie_id,
        fournisseur_id: stock.fournisseur_id,
        quantite: stock.quantite,
        unite: stock.unite,
        prix_achat: stock.prix_achat,
        prix_vente: stock.prix_vente,
        seuil_alert: stock.seuil_alert,
        emplacement: stock.emplacement,
        description: stock.description,
        actif: stock.actif
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
    setEditingStock(null);
    form.resetFields();
  };

  const filteredStocks = stocks.filter(s => {
    if (filters.categorie && s.categorie_id !== filters.categorie) return false;
    if (filters.statut === 'alert' && s.quantite >= (s.seuil_alert || 0)) return false;
    if (filters.statut === 'actif' && !s.actif) return false;
    if (filters.statut === 'inactif' && s.actif) return false;
    return true;
  });

  const getStockStatus = (stock) => {
    if (!stock.actif) return { color: 'red', text: 'Inactif' };
    if (stock.quantite <= (stock.seuil_alert || 0)) return { color: 'orange', text: 'Alerte' };
    return { color: 'green', text: 'OK' };
  };

  const unites = ['kg', 'L', 'tonne', 'unité', 'sachet', 'boîte', 'bidon', 'autre'];

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gestion des Stocks</h1>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
            Ajouter un Stock
          </Button>
        </div>

        {/* Statistiques */}
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card>
              <Statistic 
                title="Total Stocks" 
                value={stocks.length} 
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Valeur Totale" 
                value={`€${stocks.reduce((sum, s) => sum + ((s.quantite || 0) * (s.prix_achat || 0)), 0).toFixed(2)}`} 
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="En Alerte" 
                value={stocks.filter(s => s.quantite <= (s.seuil_alert || 0) && s.actif).length} 
                prefix={<Tag color="orange">!</Tag>}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Inactifs" 
                value={stocks.filter(s => !s.actif).length} 
                prefix={<Tag color="red">X</Tag>}
              />
            </Card>
          </Col>
        </Row>

        {/* Filtres */}
        <Card className="mb-6">
          <div className="flex gap-4">
            <Select 
              placeholder="Filtrer par catégorie" 
              style={{ width: 200 }} 
              onChange={(val) => setFilters({...filters, categorie: val})}
              allowClear
            >
              {categories.map(c => (
                <Option key={c.id} value={c.id}>{c.nom}</Option>
              ))}
            </Select>
            <Select 
              placeholder="Filtrer par statut" 
              style={{ width: 200 }} 
              onChange={(val) => setFilters({...filters, statut: val})}
              allowClear
            >
              <Option value="actif">Actifs</Option>
              <Option value="inactif">Inactifs</Option>
              <Option value="alert">En Alerte</Option>
            </Select>
            <Button icon={<SearchOutlined />} type="primary">
              Rechercher
            </Button>
          </div>
        </Card>

        {/* Tableau des stocks */}
        <Card>
          <Table 
            dataSource={filteredStocks} 
            loading={isLoading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          >
            <Column title="Code" dataIndex="code" key="code" />
            <Column title="Nom" dataIndex="nom" key="nom" />
            <Column title="Catégorie" dataIndex="categorie_nom" key="categorie_nom" />
            <Column title="Quantité" dataIndex="quantite" key="quantite" />
            <Column title="Unité" dataIndex="unite" key="unite" />
            <Column title="Prix Achat" dataIndex="prix_achat" key="prix_achat" render={(val) => `€${val || 0}`} />
            <Column title="Prix Vente" dataIndex="prix_vente" key="prix_vente" render={(val) => `€${val || 0}`} />
            <Column 
              title="Statut" 
              key="statut" 
              render={(_, record) => {
                const status = getStockStatus(record);
                return <Tag color={status.color}>{status.text}</Tag>;
              }}
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
                    title="Êtes-vous sûr de vouloir supprimer ce stock ?"
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
          title={editingStock ? 'Modifier Stock' : 'Ajouter Stock'} 
          open={isModalVisible} 
          onOk={handleOk} 
          onCancel={handleCancel}
          confirmLoading={mutation.isLoading}
          width={600}
        >
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item 
                  name="nom" 
                  label="Nom" 
                  rules={[{ required: true, message: 'Veuillez entrer un nom' }]}
                >
                  <Input placeholder="Nom du stock" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name="code" 
                  label="Code" 
                  rules={[{ required: true, message: 'Veuillez entrer un code' }]}
                >
                  <Input placeholder="Code interne" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="categorie_id" label="Catégorie">
                  <Select placeholder="Sélectionnez une catégorie">
                    {categories.map(c => (
                      <Option key={c.id} value={c.id}>{c.nom}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="fournisseur_id" label="Fournisseur">
                  <Select placeholder="Sélectionnez un fournisseur">
                    {fournisseurs.map(f => (
                      <Option key={f.id} value={f.id}>{f.nom}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item 
                  name="quantite" 
                  label="Quantité" 
                  rules={[{ required: true, message: 'Veuillez entrer une quantité' }]}
                >
                  <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="unite" label="Unité">
                  <Select placeholder="Unité">
                    {unites.map(u => (
                      <Option key={u} value={u}>{u}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="seuil_alert" label="Seuil Alerte">
                  <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="prix_achat" label="Prix d'Achat (€)">
                  <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="prix_vente" label="Prix de Vente (€)">
                  <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="emplacement" label="Emplacement">
              <Input placeholder="Emplacement dans le stock" />
            </Form.Item>
            <Form.Item name="description" label="Description">
              <TextArea rows={3} placeholder="Description du stock" />
            </Form.Item>
            <Form.Item name="actif" label="Actif" valuePropName="checked">
              <Select placeholder="Statut">
                <Option value={true}>Actif</Option>
                <Option value={false}>Inactif</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Layout>
  );
};

export default StocksPage;
