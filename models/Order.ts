/**
 * Order model definition
 * 
 * This file defines the structure for order data used throughout the application,
 * with helper functions for data conversion.
 */

// Basic order interface
export interface Order {
  id?: string;
  date: string;
  productCode: string;
  productName: string;
  unit: string;
  quantity: string;
  companyCode: string;
  companyName: string;
  createdAt: Date;
  updatedAt?: Date;
  userId?: string;
  status?: 'pending' | 'completed' | 'cancelled';
}

// Helper functions for Firebase integration
export const OrderUtils = {
  // Convert a Firestore document to an Order object
  fromFirestore: (doc: any): Order => {
    const data = doc.data();
    return {
      id: doc.id,
      date: data.date,
      productCode: data.productCode,
      productName: data.productName,
      unit: data.unit,
      quantity: data.quantity,
      companyCode: data.companyCode,
      companyName: data.companyName,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate(),
      userId: data.userId,
      status: data.status || 'pending',
    };
  },

  // Convert an Order object to a Firestore-friendly format
  toFirestore: (order: Order): any => {
    // Remove the id field as it's stored separately by Firestore
    const { id, ...orderData } = order;
    
    // Return the formatted data
    return {
      ...orderData,
      // Ensure dates are properly formatted
      createdAt: order.createdAt,
      updatedAt: new Date(),
    };
  }
};

export default Order;
