"""
Page de gestion des parcelles
"""
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { Card, Button, Input, Select, DatePicker, Modal, Table, Statistic, Row, Col, message, Form, Space, Tag, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import Layout from '../../components/Layout';

const { Option } = Select;
const { Column } = Table;
const { TextArea } = Input;

const ParcellesPage = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingParcelle, setEditingParcelle] = useState(null);
  const [filters, setFilters] = useState({ statut: null, type_sol: null });
  const queryClient = useQueryClient();

  // Récupérer les parcelles
  const { data: parcelles = [], isLoading, error } = useQuery('parcelles', async () => {
    const res = await axios.get('/api/parcelles');
    return res.data;
  });

  // Récupérer les types de sol
  const { data: typesSol = [] } = useQuery('types_sol', async () => {
    const res = await axios.get('/api/parcelles/types-sol');
    return res.data;
  });

  // Créer ou mettre à jour une parcelle
  const mutation = useMutation(
    async (data) => {
      if (editingParcelle) {
        return axios.put(`/api/parcelles/${editingParcelle.id}`, data);
      }
      return axios.post('/api/parcelles', data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('parcelles');
        setIsModalVisible(false);
        setEditingParcelle(null);
        form.resetFields();
        message.success(editingParcelle ? 'Parcelle mise à jour' : 'Parcelle créée');
      },
      onError: (err) => {
        message.error(err.response?.data?.detail || 'Erreur lors de la sauvegarde');
      }
    }
  );

  // Supprimer une parcelle
  const deleteMutation = useMutation(
    async (id) => axios.delete(`/api/parcelles/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('parcelles');
        message.success('Parcelle supprimée');
      },
      onError: (err) => {
        message.error(err.response?.data?.detail || 'Erreur lors de la suppression');
      }
    }
  );

  const showModal = (parcelle = null) => {
    setEditingParcelle(parcelle);
    if (parcelle) {
      form.setFieldsValue({
        nom: parcelle.nom,
        code: parcelle.code,
        surface: parcelle.surface,
        type_sol_id: parcelle.type_sol_id,
        statut: parcelle.statut,
        localisation: parcelle.localisation,
        notes: parcelle.notes
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
    setEditingParcelle(null);
    form.resetFields();
  };

  const filteredParcelles = parcelles.filter(p => {
    if (filters.statut && p.statut !== filters.statut) return false;
    if (filters.type_sol && p.type_sol_id !== filters.type_sol) return false;
    return true;
  });

  const statutColors = {
    libre: 'green',
    en_culture: 'blue',
    en_jachere: 'orange',
    en_entretien: 'purple'
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gestion des Parcelles</h1>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
            Ajouter une Parcelle
          </Button>
        </div>

        {/* Statistiques */}
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card>
              <Statistic title="Total Parcelles" value={parcelles.length} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="En Culture" 
                value={parcelles.filter(p => p.statut === 'en_culture').length} 
                prefix={<Tag color="blue">C</Tag>}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Surface Totale" 
                value={`${parcelles.reduce((sum, p) => sum + (p.surface || 0), 0).toFixed(2)} ha`} 
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Libres" 
                value={parcelles.filter(p => p.statut === 'libre').length} 
                prefix={<Tag color="green">L</Tag>}
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
              <Option value="libre">Libre</Option>
              <Option value="en_culture">En Culture</Option>
              <Option value="en_jachere">En Jachère</Option>
              <Option value="en_entretien">En Entretien</Option>
            </Select>
            <Select 
              placeholder="Filtrer par type de sol" 
              style={{ width: 200 }} 
              onChange={(val) => setFilters({...filters, type_sol: val})}
              allowClear
            >
              {typesSol.map(ts => (
                <Option key={ts.id} value={ts.id}>{ts.nom}</Option>
              ))}
            </Select>
            <Button icon={<SearchOutlined />} type="primary">
              Rechercher
            </Button>
          </div>
        </Card>

        {/* Tableau des parcelles */}
        <Card>
          <Table 
            dataSource={filteredParcelles} 
            loading={isLoading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          >
            <Column title="Code" dataIndex="code" key="code" />
            <Column title="Nom" dataIndex="nom" key="nom" />
            <Column title="Surface (ha)" dataIndex="surface" key="surface" />
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
            <Column title="Localisation" dataIndex="localisation" key="localisation" />
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
                    title="Êtes-vous sûr de vouloir supprimer cette parcelle ?"
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
          title={editingParcelle ? 'Modifier Parcelle' : 'Ajouter Parcelle'} 
          open={isModalVisible} 
          onOk={handleOk} 
          onCancel={handleCancel}
          confirmLoading={mutation.isLoading}
        >
          <Form form={form} layout="vertical">
            <Form.Item 
              name="nom" 
              label="Nom" 
              rules={[{ required: true, message: 'Veuillez entrer un nom' }]}
            >
              <Input placeholder="Nom de la parcelle" />
            </Form.Item>
            <Form.Item 
              name="code" 
              label="Code" 
              rules={[{ required: true, message: 'Veuillez entrer un code' }]}
            >
              <Input placeholder="Code interne" />
            </Form.Item>
            <Form.Item 
              name="surface" 
              label="Surface (ha)" 
              rules={[{ required: true, message: 'Veuillez entrer une surface' }]}
            >
              <Input type="number" step="0.01" placeholder="Surface en hectares" />
            </Form.Item>
            <Form.Item name="type_sol_id" label="Type de Sol">
              <Select placeholder="Sélectionnez un type de sol">
                {typesSol.map(ts => (
                  <Option key={ts.id} value={ts.id}>{ts.nom}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="statut" label="Statut">
              <Select placeholder="Sélectionnez un statut">
                <Option value="libre">Libre</Option>
                <Option value="en_culture">En Culture</Option>
                <Option value="en_jachere">En Jachère</Option>
                <Option value="en_entretien">En Entretien</Option>
              </Select>
            </Form.Item>
            <Form.Item name="localisation" label="Localisation">
              <Input placeholder="GPS ou adresse" />
            </Form.Item>
            <Form.Item name="notes" label="Notes">
              <TextArea rows={3} placeholder="Notes supplémentaires" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Layout>
  );
};

export default ParcellesPage;
