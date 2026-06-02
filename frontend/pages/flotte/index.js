"""
Page de gestion de la flotte de véhicules
"""
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { Card, Button, Input, Select, Modal, Table, Statistic, Row, Col, message, Form, Space, Tag, Popconfirm, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, CarOutlined } from '@ant-design/icons';
import Layout from '../../components/Layout';

const { Option } = Select;
const { Column } = Table;
const { TextArea } = Input;

const FlottePage = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingVehicule, setEditingVehicule] = useState(null);
  const [filters, setFilters] = useState({ statut: null, type: null });
  const queryClient = useQueryClient();

  // Récupérer les véhicules
  const { data: vehicules = [], isLoading } = useQuery('vehicules', async () => {
    const res = await axios.get('/api/flotte/vehicules');
    return res.data;
  });

  // Récupérer les types de véhicules
  const { data: typesVehicule = [] } = useQuery('types_vehicules', async () => {
    const res = await axios.get('/api/flotte/types-vehicules');
    return res.data;
  });

  // Récupérer les conducteurs
  const { data: conducteurs = [] } = useQuery('conducteurs', async () => {
    const res = await axios.get('/api/flotte/conducteurs');
    return res.data;
  });

  // Créer ou mettre à jour un véhicule
  const mutation = useMutation(
    async (data) => {
      if (editingVehicule) {
        return axios.put(`/api/flotte/vehicules/${editingVehicule.id}`, data);
      }
      return axios.post('/api/flotte/vehicules', data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('vehicules');
        setIsModalVisible(false);
        setEditingVehicule(null);
        form.resetFields();
        message.success(editingVehicule ? 'Véhicule mis à jour' : 'Véhicule créé');
      },
      onError: (err) => {
        message.error(err.response?.data?.detail || 'Erreur lors de la sauvegarde');
      }
    }
  );

  // Supprimer un véhicule
  const deleteMutation = useMutation(
    async (id) => axios.delete(`/api/flotte/vehicules/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('vehicules');
        message.success('Véhicule supprimé');
      },
      onError: (err) => {
        message.error(err.response?.data?.detail || 'Erreur lors de la suppression');
      }
    }
  );

  const showModal = (vehicule = null) => {
    setEditingVehicule(vehicule);
    if (vehicule) {
      form.setFieldsValue({
        immatriculation: vehicule.immatriculation,
        nom: vehicule.nom,
        type_vehicule_id: vehicule.type_vehicule_id,
        marque: vehicule.marque,
        modele: vehicule.modele,
        annee: vehicule.annee,
        type_carburant: vehicule.type_carburant,
        kilometrage: vehicule.kilometrage,
        statut: vehicule.statut,
        conducteur_id: vehicule.conducteur_id
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
    setEditingVehicule(null);
    form.resetFields();
  };

  const statutColors = {
    disponible: 'green',
    en_service: 'blue',
    en_maintenance: 'orange',
    en_panne: 'red',
    retire: 'gray'
  };

  const filteredVehicules = vehicules.filter(v => {
    if (filters.statut && v.statut !== filters.statut) return false;
    if (filters.type && v.type_vehicule_id !== filters.type) return false;
    return true;
  });

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gestion de la Flotte</h1>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
            Ajouter un Véhicule
          </Button>
        </div>

        {/* Statistiques */}
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card>
              <Statistic title="Total Véhicules" value={vehicules.length} prefix={<CarOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Disponibles" 
                value={vehicules.filter(v => v.statut === 'disponible').length} 
                prefix={<Tag color="green">D</Tag>}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="En Service" 
                value={vehicules.filter(v => v.statut === 'en_service').length} 
                prefix={<Tag color="blue">S</Tag>}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Kilométrage Total" 
                value={`${vehicules.reduce((sum, v) => sum + (v.kilometrage || 0), 0)} km`} 
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
              <Option value="disponible">Disponible</Option>
              <Option value="en_service">En Service</Option>
              <Option value="en_maintenance">En Maintenance</Option>
              <Option value="en_panne">En Panne</Option>
              <Option value="retire">Retiré</Option>
            </Select>
            <Select 
              placeholder="Filtrer par type" 
              style={{ width: 200 }} 
              onChange={(val) => setFilters({...filters, type: val})}
              allowClear
            >
              {typesVehicule.map(t => (
                <Option key={t.id} value={t.id}>{t.nom}</Option>
              ))}
            </Select>
            <Button icon={<SearchOutlined />} type="primary">
              Rechercher
            </Button>
          </div>
        </Card>

        {/* Tableau des véhicules */}
        <Card>
          <Table 
            dataSource={filteredVehicules} 
            loading={isLoading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          >
            <Column title="Immatriculation" dataIndex="immatriculation" key="immatriculation" />
            <Column title="Nom" dataIndex="nom" key="nom" />
            <Column title="Type" dataIndex="type_vehicule_nom" key="type_vehicule_nom" />
            <Column title="Marque" dataIndex="marque" key="marque" />
            <Column title="Modèle" dataIndex="modele" key="modele" />
            <Column title="Année" dataIndex="annee" key="annee" />
            <Column title="Kilométrage" dataIndex="kilometrage" key="kilometrage" render={(val) => `${val || 0} km`} />
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
                  <Button icon={<EyeOutlined />} onClick={() => showModal(record)} size="small" />
                  <Button icon={<EditOutlined />} onClick={() => showModal(record)} size="small" type="link" />
                  <Popconfirm
                    title="Êtes-vous sûr de vouloir supprimer ce véhicule ?"
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
          title={editingVehicule ? 'Modifier Véhicule' : 'Ajouter Véhicule'} 
          open={isModalVisible} 
          onOk={handleOk} 
          onCancel={handleCancel}
          confirmLoading={mutation.isLoading}
          width={600}
        >
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="immatriculation" label="Immatriculation" rules={[{ required: true, message: 'Veuillez entrer une immatriculation' }]}>
                  <Input placeholder="Numéro d'immatriculation" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="nom" label="Nom">
                  <Input placeholder="Nom du véhicule" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="type_vehicule_id" label="Type de Véhicule">
                  <Select placeholder="Sélectionnez un type">
                    {typesVehicule.map(t => (
                      <Option key={t.id} value={t.id}>{t.nom}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="conducteur_id" label="Conducteur">
                  <Select placeholder="Sélectionnez un conducteur">
                    {conducteurs.map(c => (
                      <Option key={c.id} value={c.id}>{c.nom} {c.prenom}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="marque" label="Marque">
                  <Input placeholder="Marque" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="modele" label="Modèle">
                  <Input placeholder="Modèle" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="annee" label="Année">
                  <InputNumber style={{ width: '100%' }} min={1900} max={2100} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="kilometrage" label="Kilométrage">
                  <InputNumber style={{ width: '100%' }} min={0} step={1} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="statut" label="Statut">
              <Select placeholder="Sélectionnez un statut">
                <Option value="disponible">Disponible</Option>
                <Option value="en_service">En Service</Option>
                <Option value="en_maintenance">En Maintenance</Option>
                <Option value="en_panne">En Panne</Option>
                <Option value="retire">Retiré</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Layout>
  );
};

export default FlottePage;
