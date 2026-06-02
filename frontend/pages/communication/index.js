"""
Page de gestion de la communication
"""
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { Card, Button, Input, Select, Modal, Table, Statistic, Row, Col, message, Form, Space, Tag, Popconfirm, InputNumber, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, MailOutlined, MessageOutlined } from '@ant-design/icons';
import Layout from '../../components/Layout';

const { Option } = Select;
const { Column } = Table;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const CommunicationPage = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCampagne, setEditingCampagne] = useState(null);
  const [filters, setFilters] = useState({ statut: null, type: null });
  const queryClient = useQueryClient();

  // Récupérer les campagnes
  const { data: campagnes = [], isLoading } = useQuery('campagnes', async () => {
    const res = await axios.get('/api/communication/campagnes');
    return res.data;
  });

  // Récupérer les canaux
  const { data: canaux = [] } = useQuery('canaux_communication', async () => {
    const res = await axios.get('/api/communication/canaux');
    return res.data;
  });

  // Créer ou mettre à jour une campagne
  const mutation = useMutation(
    async (data) => {
      if (editingCampagne) {
        return axios.put(`/api/communication/campagnes/${editingCampagne.id}`, data);
      }
      return axios.post('/api/communication/campagnes', data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('campagnes');
        setIsModalVisible(false);
        setEditingCampagne(null);
        form.resetFields();
        message.success(editingCampagne ? 'Campagne mise à jour' : 'Campagne créée');
      },
      onError: (err) => {
        message.error(err.response?.data?.detail || 'Erreur lors de la sauvegarde');
      }
    }
  );

  // Supprimer une campagne
  const deleteMutation = useMutation(
    async (id) => axios.delete(`/api/communication/campagnes/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('campagnes');
        message.success('Campagne supprimée');
      },
      onError: (err) => {
        message.error(err.response?.data?.detail || 'Erreur lors de la suppression');
      }
    }
  );

  const showModal = (campagne = null) => {
    setEditingCampagne(campagne);
    if (campagne) {
      form.setFieldsValue({
        nom: campagne.nom,
        canal_id: campagne.canal_id,
        type_message: campagne.type_message,
        statut: campagne.statut,
        date_debut: campagne.date_debut,
        date_fin: campagne.date_fin,
        cout: campagne.cout,
        observations: campagne.observations
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
    setEditingCampagne(null);
    form.resetFields();
  };

  const statutColors = {
    brouillon: 'gray',
    planifie: 'blue',
    en_cours: 'green',
    terminee: 'purple',
    annulee: 'red'
  };

  const typeMessageColors = {
    promotionnel: 'gold',
    informationnel: 'blue',
    relance: 'orange',
    alerte: 'red',
    autre: 'gray'
  };

  const filteredCampagnes = campagnes.filter(c => {
    if (filters.statut && c.statut !== filters.statut) return false;
    if (filters.type && c.type_message !== filters.type) return false;
    return true;
  });

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gestion de la Communication</h1>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
            Ajouter une Campagne
          </Button>
        </div>

        {/* Statistiques */}
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card>
              <Statistic title="Total Campagnes" value={campagnes.length} prefix={<MailOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="En Cours" 
                value={campagnes.filter(c => c.statut === 'en_cours').length} 
                prefix={<Tag color="green">C</Tag>}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Terminées" 
                value={campagnes.filter(c => c.statut === 'terminee').length} 
                prefix={<Tag color="purple">T</Tag>}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Coût Total" 
                value={`€${campagnes.reduce((sum, c) => sum + (c.cout || 0), 0).toFixed(2)}`} 
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
              <Option value="brouillon">Brouillon</Option>
              <Option value="planifie">Planifié</Option>
              <Option value="en_cours">En Cours</Option>
              <Option value="terminee">Terminée</Option>
              <Option value="annulee">Annulée</Option>
            </Select>
            <Select 
              placeholder="Filtrer par type" 
              style={{ width: 200 }} 
              onChange={(val) => setFilters({...filters, type: val})}
              allowClear
            >
              <Option value="promotionnel">Promotionnel</Option>
              <Option value="informationnel">Informationnel</Option>
              <Option value="relance">Relance</Option>
              <Option value="alerte">Alerte</Option>
              <Option value="autre">Autre</Option>
            </Select>
            <Button icon={<SearchOutlined />} type="primary">
              Rechercher
            </Button>
          </div>
        </Card>

        {/* Tableau des campagnes */}
        <Card>
          <Table 
            dataSource={filteredCampagnes} 
            loading={isLoading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          >
            <Column title="Nom" dataIndex="nom" key="nom" />
            <Column title="Canal" dataIndex="canal_nom" key="canal_nom" />
            <Column title="Type" dataIndex="type_message" key="type_message" render={(type) => (
              <Tag color={typeMessageColors[type] || 'default'}>{type}</Tag>
            )} />
            <Column title="Cibles" dataIndex="nombre_cibles" key="nombre_cibles" />
            <Column title="Envoyés" dataIndex="nombre_envoyes" key="nombre_envoyes" />
            <Column title="Coût" dataIndex="cout" key="cout" render={(val) => `€${val || 0}`} />
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
                    title="Êtes-vous sûr de vouloir supprimer cette campagne ?"
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
          title={editingCampagne ? 'Modifier Campagne' : 'Ajouter Campagne'} 
          open={isModalVisible} 
          onOk={handleOk} 
          onCancel={handleCancel}
          confirmLoading={mutation.isLoading}
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item name="nom" label="Nom" rules={[{ required: true, message: 'Veuillez entrer un nom' }]}>
              <Input placeholder="Nom de la campagne" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="canal_id" label="Canal">
                  <Select placeholder="Sélectionnez un canal">
                    {canaux.map(c => (
                      <Option key={c.id} value={c.id}>{c.nom}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="type_message" label="Type de Message">
                  <Select placeholder="Sélectionnez un type">
                    <Option value="promotionnel">Promotionnel</Option>
                    <Option value="informationnel">Informationnel</Option>
                    <Option value="relance">Relance</Option>
                    <Option value="alerte">Alerte</Option>
                    <Option value="autre">Autre</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="date_debut" label="Date de Début">
                  <DatePicker style={{ width: '100%' }} showTime />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="date_fin" label="Date de Fin">
                  <DatePicker style={{ width: '100%' }} showTime />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="cout" label="Coût (€)">
              <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
            </Form.Item>
            <Form.Item name="statut" label="Statut">
              <Select placeholder="Sélectionnez un statut">
                <Option value="brouillon">Brouillon</Option>
                <Option value="planifie">Planifié</Option>
                <Option value="en_cours">En Cours</Option>
                <Option value="terminee">Terminée</Option>
                <Option value="annulee">Annulée</Option>
              </Select>
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

export default CommunicationPage;
