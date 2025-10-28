package com.example.project_iot_auto_watering.ui.home.adapter

import android.util.Log
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.project_iot_auto_watering.data.model.Crops
import com.example.project_iot_auto_watering.data.model.DataSensor
import com.example.project_iot_auto_watering.databinding.ItemCropsBlankBinding
import com.example.project_iot_auto_watering.databinding.ItemCropsHomeBinding

class CropsAdapter(
    private val listCrops: List<Crops>,
    private val listDataSensor: List<DataSensor>,
    private val listener: OnCropsClickListener
) :
    RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    private val TYPE_BLANK = 0
    private val TYPE_CROPS = 1


    override fun getItemViewType(position: Int): Int {
        return if (listCrops.isEmpty()) {
            TYPE_BLANK
        } else {
            if (position == listCrops.size) TYPE_BLANK else TYPE_CROPS
        }
    }

    override fun onCreateViewHolder(
        parent: ViewGroup,
        viewType: Int
    ): RecyclerView.ViewHolder {
        return when (viewType) {
            TYPE_BLANK -> {
                val view = ItemCropsBlankBinding.inflate(
                    LayoutInflater.from(parent.context),
                    parent,
                    false
                )
                CropsViewHolderBlank(view)
            }

            TYPE_CROPS -> {
                val view = ItemCropsHomeBinding.inflate(
                    LayoutInflater.from(parent.context),
                    parent,
                    false
                )
                CropsViewHolder(view)
            }

            else -> throw IllegalArgumentException("Invalid view type")
        }

    }

    override fun onBindViewHolder(
        holder: RecyclerView.ViewHolder,
        position: Int
    ) {
        when (holder) {
            is CropsViewHolder -> {
                Log.d("TYPE", "CropsViewHolder")
                val itemCrops = listCrops[position]

                var dataSensor = DataSensor("-1", "0", "0", "0")

                for (data in listDataSensor) {
                    if (data.idSensor == itemCrops.idSensor) {
                        dataSensor = data
                        break
                    }
                }

                holder.bind(itemCrops, dataSensor)
            }

            is CropsViewHolderBlank -> {
                Log.d("TYPE", "CropsViewHolderBlank")
                holder.itemView.setOnClickListener {
                    listener.onBlankClick()
                }
            }
        }
    }

    override fun getItemCount(): Int {
        return if (listCrops.isEmpty()) 1 else listCrops.size + 1
    }

    interface OnCropsClickListener {
        fun onBlankClick()
        fun onCropsClick(crop: Crops, dataSensor: DataSensor)
    }
}