// src/components/basket/BasketCard.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const BasketCard = ({ basket, onSelect, isSelected = false }) => {
  const { name, description, price, items, deliveryDay, tag } = basket;

  return (
    <TouchableOpacity 
      style={[styles.container, isSelected && styles.selectedContainer]}
      onPress={() => onSelect(basket)}
      activeOpacity={0.7}
    >
      {tag && (
        <View style={styles.tag}>
          <Text style={styles.tagText}>{tag}</Text>
        </View>
      )}
      
      <View style={styles.header}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.price}>GH₵ {price}</Text>
      </View>
      
      <Text style={styles.description}>{description}</Text>
      
      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Ionicons name="basket-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{items.length} items</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.detailText}>Every {deliveryDay}</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.selectButton}
        onPress={() => onSelect(basket)}
      >
        <Text style={styles.selectButtonText}>
          {isSelected ? 'Selected' : 'Select Basket'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedContainer: {
    borderColor: '#4CAF50',
    borderWidth: 2,
    backgroundColor: '#F1F8E9',
  },
  tag: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B5E20',
  },
  price: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2E7D32',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  selectButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BasketCard;