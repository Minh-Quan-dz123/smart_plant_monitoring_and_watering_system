package com.example.project_iot_auto_watering.ui.home.adapter

import android.util.Log
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.project_iot_auto_watering.data.model.response.DataEspAll
import com.example.project_iot_auto_watering.data.model.response.EspDevice
import com.example.project_iot_auto_watering.data.model.response.Garden
import com.example.project_iot_auto_watering.data.model.response.GardenInfo
import com.example.project_iot_auto_watering.databinding.ItemCropsBlankBinding
import com.example.project_iot_auto_watering.databinding.ItemCropsHomeBinding

class CropsAdapter(
    private val listGarden: List<Garden>,
    private val listDevice: List<DataEspAll>,
    private val listener: OnCropsClickListener
) :
    RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    private val TYPE_BLANK = 0
    private val TYPE_CROPS = 1

    private var espDeviceDefault= DataEspAll("-1",0.0f,0.0f,0.0f,"",false, GardenInfo(-1,""))
    private var espDevice= DataEspAll("-1",0.0f,0.0f,0.0f,"",false, GardenInfo(-1,""))


    override fun getItemViewType(position: Int): Int {
        return if (listGarden.isEmpty()) {
            TYPE_BLANK
        } else {
            if (position == listGarden.size) TYPE_BLANK else TYPE_CROPS
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
                val itemGarden = listGarden[position]

                for(esp in listDevice){
                    if(esp.espId==itemGarden.espId){
                        espDevice=esp
                        break
                    }
                }


                holder.bind(itemGarden,espDevice)
                espDevice=espDeviceDefault
                holder.itemView.setOnClickListener {
                    listener.onCropsClick(itemGarden)
                }
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
        return if (listGarden.isEmpty()) 1 else listGarden.size + 1
    }

    interface OnCropsClickListener {
        fun onBlankClick()
        fun onCropsClick(garden: Garden)
    }

}