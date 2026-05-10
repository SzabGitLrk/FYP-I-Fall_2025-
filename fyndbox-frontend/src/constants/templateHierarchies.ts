import { TemplateHierarchyStorage } from '../types/templateHierarchy';

export const TEMPLATE_HIERARCHIES: TemplateHierarchyStorage[] = [
  {
    storageName: 'Library',
    boxes: [
      {
        name: 'Fiction',
        items: [
          { name: 'Novels', quantity: 0 },
          { name: 'Short Stories', quantity: 0 },
          { name: 'Thrillers', quantity: 0 },
          { name: 'Science Fiction', quantity: 0 },
          { name: 'Fantasy', quantity: 0 },
        ],
      },
      {
        name: 'Literature & Arts',
        items: [
          { name: 'Poetry', quantity: 0 },
          { name: 'Drama & Plays', quantity: 0 },
          { name: 'Classic Literature', quantity: 0 },
          { name: 'Essays', quantity: 0 },
        ],
      },
      {
        name: 'Visual & Graphic',
        items: [
          { name: 'Comics', quantity: 0 },
          { name: 'Graphic Novels', quantity: 0 },
          { name: 'Manga', quantity: 0 },
          { name: 'Art Books', quantity: 0 },
        ],
      },
      {
        name: 'Non-Fiction',
        items: [
          { name: 'History', quantity: 0 },
          { name: 'Science', quantity: 0 },
          { name: 'Biographies', quantity: 0 },
          { name: 'Memoirs', quantity: 0 },
          { name: 'Philosophy', quantity: 0 },
          { name: 'Self-Help', quantity: 0 },
        ],
      },
      {
        name: 'Reference',
        items: [
          { name: 'Dictionaries', quantity: 0 },
          { name: 'Encyclopedias', quantity: 0 },
          { name: 'Maps & Atlases', quantity: 0 },
          { name: 'Textbooks', quantity: 0 },
          { name: 'Research Papers', quantity: 0 },
        ],
      },
      {
        name: 'Periodicals',
        items: [
          { name: 'Journals', quantity: 0 },
          { name: 'Magazines', quantity: 0 },
          { name: 'Newspapers', quantity: 0 },
        ],
      },
    ],
  },
  {
    storageName: 'Mart',
    boxes: [
      {
        name: 'Dairy Section',
        items: [
          { name: 'Milk & Cream', quantity: 0 },
          { name: 'Cheese & Butter', quantity: 0 },
          { name: 'Yogurt', quantity: 0 },
        ],
      },
      {
        name: 'Dry Goods',
        items: [
          { name: 'Rice & Pulses', quantity: 0 },
          { name: 'Flour (Atta)', quantity: 0 },
          { name: 'Sugar & Salt', quantity: 0 },
        ],
      },
      {
        name: 'Produce',
        items: [
          { name: 'Vegetables', quantity: 0 },
          { name: 'Fruits', quantity: 0 },
        ],
      },
      {
        name: 'Snacks & Drinks',
        items: [
          { name: 'Soft Drinks', quantity: 0 },
          { name: 'Juices', quantity: 0 },
          { name: 'Biscuits & Chips', quantity: 0 },
        ],
      },
      {
        name: 'Toys',
        items: [
          { name: 'Action Toys', quantity: 0 },
          { name: 'Educational Toys', quantity: 0 },
          { name: 'Soft Toys', quantity: 0 },
        ],
      },
      {
        name: 'Pottery',
        items: [
          { name: 'Decorative Pottery', quantity: 0 },
          { name: 'Kitchen Pottery', quantity: 0 },
        ],
      },
      {
        name: 'Fashion',
        items: [
          { name: 'Women', quantity: 0 },
          { name: 'Men', quantity: 0 },
          { name: 'Kids', quantity: 0 },
        ],
      },
      {
        name: 'Personal Care',
        items: [
          { name: 'Creams & Lotions', quantity: 0 },
          { name: 'Hair Care', quantity: 0 },
          { name: 'Bath & Soap', quantity: 0 },
        ],
      },
    ],
  },
  {
    storageName: 'Laboratory',
    boxes: [
      {
        name: 'Glassware',
        items: [
          { name: 'Beakers', quantity: 0 },
          { name: 'Flasks', quantity: 0 },
        ],
      },
      {
        name: 'Chemicals',
        items: [
          { name: 'Acids', quantity: 0 },
          { name: 'Bases', quantity: 0 },
        ],
      },
    ],
  },
  {
    storageName: 'Pharmacy',
    boxes: [
      {
        name: 'Pain Relief',
        items: [
          { name: 'Tablets', quantity: 0 },
          { name: 'Syrups', quantity: 0 },
          { name: 'Topical Relief', quantity: 0 },
        ],
      },
      {
        name: 'First Aid',
        items: [
          { name: 'Bandages', quantity: 0 },
          { name: 'Antiseptics', quantity: 0 },
          { name: 'Emergency Care', quantity: 0 },
        ],
      },
      {
        name: 'Skincare',
        items: [
          { name: 'Lotions', quantity: 0 },
          { name: 'Sunscreen', quantity: 0 },
          { name: 'Cleansers', quantity: 0 },
          { name: 'Treatment Creams', quantity: 0 },
        ],
      },
      {
        name: 'Cold & Flu',
        items: [
          { name: 'Cold Tablets', quantity: 0 },
          { name: 'Cough Syrups', quantity: 0 },
          { name: 'Lozenges & Vapor Care', quantity: 0 },
        ],
      },
      {
        name: 'Vitamins & Supplements',
        items: [
          { name: 'Daily Vitamins', quantity: 0 },
          { name: 'Minerals', quantity: 0 },
          { name: 'Special Supplements', quantity: 0 },
        ],
      },
    ],
  },
  {
    storageName: 'Apparel/Clothing',
    boxes: [
      {
        name: "Men's Wear",
        items: [
          { name: 'Formal Shirts', quantity: 0 },
          { name: 'Denim/Jeans', quantity: 0 },
          { name: 'T-shirts', quantity: 0 },
          { name: 'Outerwear', quantity: 0 },
        ],
      },
      {
        name: 'Footwear',
        items: [
          { name: 'Sneakers', quantity: 0 },
          { name: 'Formal Shoes', quantity: 0 },
          { name: 'Sandals', quantity: 0 },
          { name: 'Accessories', quantity: 0 },
        ],
      },
    ],
  },
  {
    storageName: 'Tech Shop',
    boxes: [
      {
        name: 'Computing',
        items: [
          { name: 'Laptops', quantity: 0 },
          { name: 'Keyboards & Mice', quantity: 0 },
          { name: 'Cables/Adapters', quantity: 0 },
          { name: 'Storage Devices', quantity: 0 },
        ],
      },
      {
        name: 'Mobile',
        items: [
          { name: 'Smartphones', quantity: 0 },
          { name: 'Cases & Covers', quantity: 0 },
          { name: 'Power Banks', quantity: 0 },
          { name: 'Charging Accessories', quantity: 0 },
        ],
      },
    ],
  },
  {
    storageName: 'Restaurant Kitchen',
    boxes: [
      {
        name: 'Pantry',
        items: [
          { name: 'Spices', quantity: 0 },
          { name: 'Grains (Rice/Flour)', quantity: 0 },
          { name: 'Canned Goods', quantity: 0 },
          { name: 'Dry Ingredients', quantity: 0 },
        ],
      },
      {
        name: 'Cold Storage',
        items: [
          { name: 'Meat & Poultry', quantity: 0 },
          { name: 'Dairy', quantity: 0 },
          { name: 'Frozen Veggies', quantity: 0 },
          { name: 'Fresh Produce', quantity: 0 },
        ],
      },
      {
        name: 'Equipment',
        items: [
          { name: 'Cutlery', quantity: 0 },
          { name: 'Pots & Pans', quantity: 0 },
          { name: 'Prep Tools', quantity: 0 },
        ],
      },
    ],
  },
  {
    storageName: 'Office Supply',
    boxes: [
      {
        name: 'Stationery',
        items: [
          { name: 'Pens & Pencils', quantity: 0 },
          { name: 'Paper & Notebooks', quantity: 0 },
          { name: 'Folders', quantity: 0 },
          { name: 'Desk Accessories', quantity: 0 },
        ],
      },
      {
        name: 'Tech Accessories',
        items: [
          { name: 'USB Drives', quantity: 0 },
          { name: 'Batteries', quantity: 0 },
          { name: 'Chargers', quantity: 0 },
        ],
      },
      {
        name: 'Breakroom',
        items: [
          { name: 'Coffee/Tea', quantity: 0 },
          { name: 'Cleaning Supplies', quantity: 0 },
          { name: 'Pantry Snacks', quantity: 0 },
        ],
      },
    ],
  },
  {
    storageName: 'Hospital/Clinic',
    boxes: [
      {
        name: 'PPE (Safety)',
        items: [
          { name: 'Masks', quantity: 0 },
          { name: 'Gloves', quantity: 0 },
          { name: 'Gowns', quantity: 0 },
        ],
      },
      {
        name: 'Medicine',
        items: [
          { name: 'Injections', quantity: 0 },
          { name: 'Saline Bottles', quantity: 0 },
          { name: 'Ointments', quantity: 0 },
        ],
      },
      {
        name: 'Instruments',
        items: [
          { name: 'Syringes', quantity: 0 },
          { name: 'Thermometers', quantity: 0 },
          { name: 'Scalpels', quantity: 0 },
          { name: 'Diagnostic Tools', quantity: 0 },
        ],
      },
    ],
  },
  {
    storageName: 'Office Users',
    boxes: [
      {
        name: 'Stationery Cabinet',
        items: [
          { name: 'Printing Paper', quantity: 0 },
          { name: 'Ink Cartridges', quantity: 0 },
          { name: 'Staplers & Clips', quantity: 0 },
        ],
      },
      {
        name: 'Archive Room',
        items: [
          { name: 'Tax Documents', quantity: 0 },
          { name: 'Employee Records', quantity: 0 },
          { name: 'Old Invoices', quantity: 0 },
        ],
      },
      {
        name: 'IT Closet',
        items: [
          { name: 'Networking Cables', quantity: 0 },
          { name: 'Spare Keyboards/Mice', quantity: 0 },
          { name: 'Monitors', quantity: 0 },
        ],
      },
    ],
  },
  {
    storageName: 'Lab Assistant',
    boxes: [
      {
        name: 'Glassware Cabinet',
        items: [
          { name: 'Beakers', quantity: 0 },
          { name: 'Test Tubes', quantity: 0 },
          { name: 'Flasks', quantity: 0 },
        ],
      },
      {
        name: 'Chemical Storage',
        items: [
          { name: 'Acids & Bases', quantity: 0 },
          { name: 'Solvents', quantity: 0 },
          { name: 'Distilled Water', quantity: 0 },
        ],
      },
      {
        name: 'Safety Station',
        items: [
          { name: 'Goggles', quantity: 0 },
          { name: 'Lab Coats', quantity: 0 },
          { name: 'Gloves', quantity: 0 },
        ],
      },
    ],
  },
  {
    storageName: 'School Exam Center',
    boxes: [
      {
        name: 'Question Papers',
        items: [
          { name: 'Mathematics Exam', quantity: 0 },
          { name: 'English Exam', quantity: 0 },
          { name: 'Science Exam', quantity: 0 },
        ],
      },
      {
        name: 'Answer Sheets',
        items: [
          { name: 'Main Answer Booklets', quantity: 0 },
          { name: 'Extra Sheets', quantity: 0 },
          { name: 'Graph Papers', quantity: 0 },
        ],
      },
      {
        name: 'Teacher Supplies',
        items: [
          { name: 'Red Marking Pens', quantity: 0 },
          { name: 'Attendance Sheets', quantity: 0 },
          { name: 'Official Stamps', quantity: 0 },
        ],
      },
    ],
  },
  {
    storageName: 'Boutique / Tailoring Shop',
    boxes: [
      {
        name: 'Fabric Storage',
        items: [
          { name: 'Silk Rolls', quantity: 0 },
          { name: 'Cotton Bundles', quantity: 0 },
          { name: 'Denim Scraps', quantity: 0 },
        ],
      },
      {
        name: 'Sewing Notions',
        items: [
          { name: 'Thread Spools', quantity: 0 },
          { name: 'Zippers & Buttons', quantity: 0 },
          { name: 'Needles & Pins', quantity: 0 },
        ],
      },
      {
        name: 'Client Orders',
        items: [
          { name: 'Finished Suits', quantity: 0 },
          { name: 'Alteration Requests', quantity: 0 },
          { name: 'Measurements', quantity: 0 },
        ],
      },
    ],
  },
  {
    storageName: 'Gym / Fitness Center',
    boxes: [
      {
        name: 'Weight Room',
        items: [
          { name: 'Dumbbells', quantity: 0 },
          { name: 'Kettlebells', quantity: 0 },
          { name: 'Barbell Plates', quantity: 0 },
        ],
      },
      {
        name: 'Yoga Studio',
        items: [
          { name: 'Mats', quantity: 0 },
          { name: 'Foam Rollers', quantity: 0 },
          { name: 'Resistance Bands', quantity: 0 },
        ],
      },
      {
        name: 'Locker Room Supplies',
        items: [
          { name: 'Fresh Towels', quantity: 0 },
          { name: 'Cleaning Sprays', quantity: 0 },
          { name: 'First Aid Kit', quantity: 0 },
        ],
      },
    ],
  },
  {
    storageName: 'Auto Workshop',
    boxes: [
      {
        name: 'Engine Parts',
        items: [
          { name: 'Spark Plugs', quantity: 0 },
          { name: 'Oil Filters', quantity: 0 },
          { name: 'Belts & Hoses', quantity: 0 },
        ],
      },
      {
        name: 'Hand Tools',
        items: [
          { name: 'Socket Wrench Set', quantity: 0 },
          { name: 'Screwdrivers', quantity: 0 },
          { name: 'Pliers', quantity: 0 },
        ],
      },
      {
        name: 'Fluids & Oils',
        items: [
          { name: 'Engine Oil', quantity: 0 },
          { name: 'Brake Fluid', quantity: 0 },
          { name: 'Coolant / Antifreeze', quantity: 0 },
        ],
      },
    ],
  },
  {
    storageName: 'Beauty Salon',
    boxes: [
      {
        name: 'Hair Station',
        items: [
          { name: 'Shampoos & Conditioners', quantity: 0 },
          { name: 'Hair Dyes / Colors', quantity: 0 },
          { name: 'Brushes & Combs', quantity: 0 },
        ],
      },
      {
        name: 'Nail Corner',
        items: [
          { name: 'Nail Polishes', quantity: 0 },
          { name: 'Acetone / Removers', quantity: 0 },
          { name: 'Manicure Tools', quantity: 0 },
        ],
      },
      {
        name: 'Electricals',
        items: [
          { name: 'Hair Dryers', quantity: 0 },
          { name: 'Straighteners', quantity: 0 },
          { name: 'Electric Clippers', quantity: 0 },
        ],
      },
    ],
  },
  {
    storageName: 'Hardware Store',
    boxes: [
      {
        name: 'Fasteners',
        items: [
          { name: 'Wood Screws', quantity: 0 },
          { name: 'Steel Bolts', quantity: 0 },
          { name: 'Wall Plugs', quantity: 0 },
        ],
      },
      {
        name: 'Electrical',
        items: [
          { name: 'Switches & Sockets', quantity: 0 },
          { name: 'Wire Coils', quantity: 0 },
          { name: 'Light Bulbs', quantity: 0 },
        ],
      },
      {
        name: 'Plumbing',
        items: [
          { name: 'PVC Pipes', quantity: 0 },
          { name: 'Taps & Valves', quantity: 0 },
          { name: 'Sealant Tapes', quantity: 0 },
        ],
      },
    ],
  },
  {
    storageName: 'Event Planner',
    boxes: [
      {
        name: 'Decorations',
        items: [
          { name: 'Balloons & Pumps', quantity: 0 },
          { name: 'Banners & Signs', quantity: 0 },
          { name: 'Table Centerpieces', quantity: 0 },
        ],
      },
      {
        name: 'Dining Ware',
        items: [
          { name: 'Disposable Plates', quantity: 0 },
          { name: 'Napkins', quantity: 0 },
          { name: 'Cutlery Sets', quantity: 0 },
        ],
      },
      {
        name: 'Lighting/AV',
        items: [
          { name: 'Fairy Lights', quantity: 0 },
          { name: 'Extension Cords', quantity: 0 },
          { name: 'Bluetooth Speakers', quantity: 0 },
        ],
      },
    ],
  },
  {
    storageName: 'Art Studio',
    boxes: [
      {
        name: 'Painting Supplies',
        items: [
          { name: 'Acrylic Tubes', quantity: 0 },
          { name: 'Oil Paints', quantity: 0 },
          { name: 'Paint Brushes', quantity: 0 },
        ],
      },
      {
        name: 'Sketching Tools',
        items: [
          { name: 'Graphite Pencils', quantity: 0 },
          { name: 'Charcoal Sticks', quantity: 0 },
          { name: 'Erasers & Sharpeners', quantity: 0 },
        ],
      },
      {
        name: 'Canvases & Paper',
        items: [
          { name: 'Stretched Canvases', quantity: 0 },
          { name: 'Sketchbooks', quantity: 0 },
          { name: 'Watercolor Paper', quantity: 0 },
        ],
      },
    ],
  },
  {
    storageName: 'Gardening & Nursery',
    boxes: [
      {
        name: 'Seeds & Bulbs',
        items: [
          { name: 'Flower Seeds', quantity: 0 },
          { name: 'Vegetable Seeds', quantity: 0 },
          { name: 'Flower Bulbs', quantity: 0 },
        ],
      },
      {
        name: 'Plant Care',
        items: [
          { name: 'Fertilizer Bags', quantity: 0 },
          { name: 'Pesticide Sprays', quantity: 0 },
          { name: 'Potting Soil', quantity: 0 },
        ],
      },
      {
        name: 'Garden Tools',
        items: [
          { name: 'Hand Trowels', quantity: 0 },
          { name: 'Pruning Shears', quantity: 0 },
          { name: 'Watering Cans', quantity: 0 },
        ],
      },
    ],
  },
  {
    storageName: 'Computer Repair Shop',
    boxes: [
      {
        name: 'Internal Components',
        items: [
          { name: 'RAM Modules', quantity: 0 },
          { name: 'SSD Drives', quantity: 0 },
          { name: 'Graphic Cards', quantity: 0 },
        ],
      },
      {
        name: 'External Peripherals',
        items: [
          { name: 'USB Keyboards', quantity: 0 },
          { name: 'Optical Mice', quantity: 0 },
          { name: 'HDMI Cables', quantity: 0 },
        ],
      },
      {
        name: 'Repair Tools',
        items: [
          { name: 'Precision Screwdrivers', quantity: 0 },
          { name: 'Thermal Paste', quantity: 0 },
          { name: 'Soldering Iron', quantity: 0 },
        ],
      },
    ],
  },
  {
    storageName: 'Photography Studio',
    boxes: [
      {
        name: 'Camera Gear',
        items: [
          { name: 'DSLR Bodies', quantity: 0 },
          { name: 'Prime Lenses', quantity: 0 },
          { name: 'Memory Cards', quantity: 0 },
        ],
      },
      {
        name: 'Lighting Gear',
        items: [
          { name: 'Softboxes', quantity: 0 },
          { name: 'LED Panels', quantity: 0 },
          { name: 'Flash Triggers', quantity: 0 },
        ],
      },
      {
        name: 'Audio Gear',
        items: [
          { name: 'Lapel Mics', quantity: 0 },
          { name: 'Boom Poles', quantity: 0 },
          { name: 'Audio Recorders', quantity: 0 },
        ],
      },
    ],
  },
  {
    storageName: 'Pet Shop',
    boxes: [
      {
        name: 'Food & Treats',
        items: [
          { name: 'Dry Kibble', quantity: 0 },
          { name: 'Canned Wet Food', quantity: 0 },
          { name: 'Chew Bones', quantity: 0 },
        ],
      },
      {
        name: 'Grooming',
        items: [
          { name: 'Pet Shampoo', quantity: 0 },
          { name: 'Flea Combs', quantity: 0 },
          { name: 'Nail Clippers', quantity: 0 },
        ],
      },
      {
        name: 'Toys & Acc.',
        items: [
          { name: 'Leashes & Collars', quantity: 0 },
          { name: 'Squeaky Toys', quantity: 0 },
          { name: 'Food Bowls', quantity: 0 },
        ],
      },
    ],
  },
  {
    storageName: 'Home',
    boxes: [
      {
        name: 'Kitchen',
        items: [
          { name: 'Cookware', quantity: 0 },
          { name: 'Dinnerware', quantity: 0 },
          { name: 'Storage Containers', quantity: 0 },
          { name: 'Appliances', quantity: 0 },
        ],
      },
      {
        name: 'Room',
        items: [
          { name: 'Bedroom', quantity: 0 },
          { name: 'Wardrobe', quantity: 0 },
          { name: 'Personal Essentials', quantity: 0 },
        ],
      },
      {
        name: 'Home Library',
        items: [
          { name: 'Books', quantity: 0 },
          { name: 'Study Supplies', quantity: 0 },
          { name: 'Documents', quantity: 0 },
        ],
      },
      {
        name: 'Bathroom',
        items: [
          { name: 'Toiletries', quantity: 0 },
          { name: 'Cleaning Supplies', quantity: 0 },
          { name: 'Towels & Linens', quantity: 0 },
        ],
      },
      {
        name: 'Laundry & Cleaning',
        items: [
          { name: 'Laundry', quantity: 0 },
          { name: 'General Cleaning', quantity: 0 },
          { name: 'Utility', quantity: 0 },
        ],
      },
      {
        name: 'Garage & Tools',
        items: [
          { name: 'Hand Tools', quantity: 0 },
          { name: 'Electrical', quantity: 0 },
          { name: 'Garden', quantity: 0 },
        ],
      },
    ],
  },
];
