import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, StatusBar, Modal, FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { Category } from '../types';

const ICONS = [
  'restaurant', 'local-cafe', 'shopping-cart', 'directions-car', 'flight',
  'pets', 'fitness-center', 'child-friendly', 'medical-services', 'school',
  'home', 'build', 'redeem', 'face', 'favorite', 'laptop-mac', 'phone-android'
];

const COLORS = [
  '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3',
  '#03A9F4', '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
  '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'
];

const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { billingCycleStartDay, customCategories, updateFamilySettings } = useAuth();

  const [savingCycle, setSavingCycle] = useState(false);
  const [cycleInput, setCycleInput] = useState(String(billingCycleStartDay));

  // Category Modal State
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatIcon, setNewCatIcon] = useState(ICONS[0]);
  const [newCatColor, setNewCatColor] = useState(COLORS[0]);

  const handleSaveCycle = async () => {
    const day = parseInt(cycleInput, 10);
    if (isNaN(day) || day < 1 || day > 31) {
      Alert.alert('Invalid Day', 'Please enter a valid day between 1 and 31.');
      return;
    }
    setSavingCycle(true);
    try {
      await updateFamilySettings({ billingCycleStartDay: day });
      Alert.alert('Success', 'Billing cycle updated!');
    } catch (e) {
      Alert.alert('Error', 'Failed to update billing cycle.');
    } finally {
      setSavingCycle(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCatLabel.trim()) {
      Alert.alert('Invalid Name', 'Please enter a category name.');
      return;
    }
    
    const newCategory: Category = {
      id: `custom_${Date.now()}`,
      label: newCatLabel.trim(),
      icon: newCatIcon,
      color: newCatColor,
      bgColor: `${newCatColor}20`, // 20% opacity for background
    };

    const updatedCategories = [...customCategories, newCategory];
    
    try {
      await updateFamilySettings({ customCategories: updatedCategories });
      setShowCatModal(false);
      setNewCatLabel('');
      setNewCatIcon(ICONS[0]);
      setNewCatColor(COLORS[0]);
    } catch (e) {
      Alert.alert('Error', 'Failed to add custom category.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    Alert.alert('Delete Category?', 'Are you sure you want to delete this custom category?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          const updatedCategories = customCategories.filter(c => c.id !== id);
          try {
            await updateFamilySettings({ customCategories: updatedCategories });
          } catch (e) {
            Alert.alert('Error', 'Failed to delete category.');
          }
        }
      }
    ]);
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        
        {/* Billing Cycle Setting */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="date-range" size={24} color={Colors.primary} />
            <Text style={styles.cardTitle}>Billing Cycle Start Day</Text>
          </View>
          <Text style={styles.cardDescription}>
            Set the day of the month when your billing cycle resets (e.g. 25 for 25th-to-24th).
            Enter 1 for standard calendar months.
          </Text>
          <View style={styles.row}>
            <TextInput
              style={styles.input}
              value={cycleInput}
              onChangeText={setCycleInput}
              keyboardType="number-pad"
              maxLength={2}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveCycle} disabled={savingCycle}>
              <Text style={styles.saveBtnText}>{savingCycle ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Custom Categories */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="category" size={24} color={Colors.primary} />
              <Text style={styles.cardTitle}>Custom Categories</Text>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowCatModal(true)}>
              <MaterialIcons name="add" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>

          {customCategories.length === 0 ? (
            <Text style={styles.emptyText}>No custom categories added yet.</Text>
          ) : (
            customCategories.map((cat) => (
              <View key={cat.id} style={styles.catRow}>
                <View style={[styles.catIconWrap, { backgroundColor: cat.bgColor }]}>
                  <MaterialIcons name={cat.icon as any} size={20} color={cat.color} />
                </View>
                <Text style={styles.catLabel}>{cat.label}</Text>
                <TouchableOpacity onPress={() => handleDeleteCategory(cat.id)} style={styles.delBtn}>
                  <MaterialIcons name="delete-outline" size={20} color={Colors.expense} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

      </ScrollView>

      {/* Add Category Modal */}
      <Modal visible={showCatModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Custom Category</Text>
            
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.modalInput}
              value={newCatLabel}
              onChangeText={setNewCatLabel}
              placeholder="e.g. Pet Supplies"
            />

            <Text style={styles.fieldLabel}>Icon</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={ICONS}
              keyExtractor={i => i}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.pickerItem, newCatIcon === item && { borderColor: Colors.primary }]}
                  onPress={() => setNewCatIcon(item)}
                >
                  <MaterialIcons name={item as any} size={24} color={newCatIcon === item ? Colors.primary : Colors.gray400} />
                </TouchableOpacity>
              )}
              style={styles.pickerList}
            />

            <Text style={styles.fieldLabel}>Color</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={COLORS}
              keyExtractor={c => c}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.colorItem, { backgroundColor: item }, newCatColor === item && styles.colorItemSelected]}
                  onPress={() => setNewCatColor(item)}
                />
              )}
              style={styles.pickerList}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCatModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createBtn} onPress={handleAddCategory}>
                <Text style={styles.createBtnText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingBottom: 16, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  content: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  card: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  cardDescription: { fontSize: 13, color: Colors.textSecondary, marginBottom: 16, lineHeight: 18 },
  row: { flexDirection: 'row', gap: 12 },
  input: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, color: Colors.textPrimary, backgroundColor: Colors.background },
  saveBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, justifyContent: 'center', borderRadius: 12 },
  saveBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
  
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  addBtn: { backgroundColor: Colors.primary, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 14, color: Colors.textMuted, fontStyle: 'italic', textAlign: 'center', paddingVertical: 12 },
  
  catRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  catIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  catLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  delBtn: { padding: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 48 },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
  modalInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 16, fontSize: 16, backgroundColor: Colors.background },
  pickerList: { marginBottom: 8 },
  pickerItem: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: Colors.background },
  colorItem: { width: 40, height: 40, borderRadius: 20, marginRight: 16, borderWidth: 3, borderColor: 'transparent' },
  colorItemSelected: { borderColor: Colors.textPrimary },
  
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 32 },
  cancelBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, backgroundColor: Colors.background, alignItems: 'center' },
  cancelBtnText: { fontSize: 16, fontWeight: '700', color: Colors.textSecondary },
  createBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center' },
  createBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
});

export default SettingsScreen;
